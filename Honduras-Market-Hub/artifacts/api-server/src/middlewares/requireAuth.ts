import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      const authHeader = req.headers.authorization;
      const hasBearer = !!authHeader && authHeader.startsWith("Bearer ");
      let jwtIss: string | undefined;
      let jwtSub: string | undefined;
      let jwtExp: number | undefined;
      if (hasBearer) {
        try {
          const token = authHeader!.slice(7);
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
            jwtIss = payload.iss;
            jwtSub = payload.sub;
            jwtExp = payload.exp;
          }
        } catch {}
      }
      const pubKeyInstance = (() => {
        const pk = process.env.CLERK_PUBLISHABLE_KEY;
        if (!pk) return null;
        try {
          const enc = pk.replace(/^pk_(test|live)_/, "");
          return Buffer.from(enc, "base64").toString("utf8").replace(/\$$/, "");
        } catch { return null; }
      })();
      req.log?.warn({
        hasBearer,
        skPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 8) ?? null,
        pubKeyInstance,
        jwtIss,
        jwtSub,
        jwtExp,
        nowSec: Math.floor(Date.now() / 1000),
      }, "[requireAuth] no userId");
      res.status(401).json({ error: "unauthorized", message: "Sign in to continue" });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (!email) {
      res.status(401).json({ error: "unauthorized", message: "User email not available" });
      return;
    }
    req.userId = userId;
    req.userEmail = email;
    next();
  } catch (err) {
    req.log?.warn({ err }, "Failed to resolve Clerk session — rejecting as unauthorized");
    res.status(401).json({ error: "unauthorized", message: "Session could not be verified. Please sign in again." });
  }
}
