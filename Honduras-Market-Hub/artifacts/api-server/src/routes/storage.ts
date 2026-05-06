import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  createPresignedUploadUrl,
  publicUrlForKey,
  isR2Configured,
} from "../lib/r2Storage";

const router: IRouter = Router();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const provided = req.headers["x-admin-key"] as string | undefined;
  if (!provided || provided !== adminPassword) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

/**
 * POST /storage/uploads/request-url
 * Admin-only: request a presigned URL for file upload to Cloudflare R2.
 */
router.post("/storage/uploads/request-url", adminAuth, async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body ?? {};
  if (!name || typeof size !== "number" || !contentType) {
    res.status(400).json({ error: "Missing or invalid required fields: name, size, contentType" });
    return;
  }

  if (!isR2Configured()) {
    res.status(500).json({ error: "Storage not configured. Missing R2_* environment variables." });
    return;
  }

  try {
    const ext = (typeof name === "string" && name.includes("."))
      ? name.split(".").pop()
      : undefined;
    const { uploadURL, key } = await createPresignedUploadUrl({ contentType, extension: ext });
    // objectPath stays compatible with the existing frontend contract:
    //   frontend computes servingUrl = `/api/storage${objectPath}`
    //   → "/api/storage/objects/<uuid>" → 302 redirect to R2 public URL
    const objectPath = `/${key}`;
    res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (error) {
    req.log.error({ err: error }, "Error generating R2 upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/objects/*
 * Redirects to the public Cloudflare R2 URL for the requested object.
 * R2's public bucket serves the file directly via CDN.
 */
router.get("/storage/objects/*objectPath", (req: Request, res: Response) => {
  const raw = req.params.objectPath;
  const objectKey = "objects/" + (Array.isArray(raw) ? raw.join("/") : raw);
  if (!isR2Configured()) {
    res.status(500).json({ error: "Storage not configured" });
    return;
  }
  res.redirect(302, publicUrlForKey(objectKey));
});

/**
 * GET /storage/public-objects/*
 * Legacy route — redirects to R2 public URL under a `public/` prefix.
 * Kept for backwards compatibility with any seeded asset references.
 */
router.get("/storage/public-objects/*filePath", (req: Request, res: Response) => {
  const raw = req.params.filePath;
  const filePath = "public/" + (Array.isArray(raw) ? raw.join("/") : raw);
  if (!isR2Configured()) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.redirect(302, publicUrlForKey(filePath));
});

export default router;
