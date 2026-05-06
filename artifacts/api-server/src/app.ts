import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk Frontend API proxy must run before body parsers (it streams raw bytes).
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS — same-origin requests (the storefront and admin panel proxy /api/* through
// the dev/prod server, so they share the API origin) don't need CORS at all.
// We only allow explicit, trusted external origins (configurable via env) and
// reflect them when present. A wildcard origin combined with credentials would
// be unsafe for cookie-backed Clerk sessions.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  }),
);

// Stripe webhook must be registered BEFORE express.json() to receive raw Buffer
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Clerk session to every request so getAuth(req) works downstream.
// Only mount when Clerk keys are configured — otherwise the middleware errors
// on every request and blocks the app from booting in fresh environments.
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
} else {
  logger.warn("Clerk keys not configured; auth-protected routes will be unavailable.");
}

app.use("/api", router);

// In production, serve the built static frontends from this same Express server.
// This lets a single Railway service host the API + admin panel + storefront
// on one origin (so cookies, CORS, and relative /api/* URLs all "just work").
const repoRoot = path.resolve(process.cwd());
const adminPanelDir = path.join(repoRoot, "artifacts/admin-panel/dist/public");
const storeDir = path.join(repoRoot, "artifacts/honduran-store/dist/public");

if (fs.existsSync(adminPanelDir)) {
  logger.info({ adminPanelDir }, "Serving admin panel static files");
  app.use("/admin-panel", express.static(adminPanelDir, { index: false }));
  app.get(/^\/admin-panel(?:\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(adminPanelDir, "index.html"));
  });
} else {
  logger.warn({ adminPanelDir }, "Admin panel build not found, skipping static mount");
}

if (fs.existsSync(storeDir)) {
  logger.info({ storeDir }, "Serving storefront static files");
  app.use(express.static(storeDir, { index: false }));
  // SPA fallback for storefront — must be LAST so it doesn't shadow other routes.
  app.get(/^\/(?!api\/|admin-panel\/?|__clerk\/).*/, (_req, res) => {
    res.sendFile(path.join(storeDir, "index.html"));
  });
} else {
  logger.warn({ storeDir }, "Storefront build not found, skipping static mount");
}

export default app;
