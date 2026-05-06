import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

/**
 * Best-effort auth middleware. Populates req.userId / req.userEmail when a valid
 * Clerk session is present, otherwise leaves them undefined and continues.
 *
 * Routes that support guest fall-back should use this middleware and then
 * branch on whether req.userEmail was populated.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      next();
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (email) {
      req.userId = userId;
      req.userEmail = email;
    }
  } catch (err) {
    req.log?.warn({ err }, "optionalAuth: ignoring Clerk lookup failure, proceeding as guest");
  }
  next();
}
