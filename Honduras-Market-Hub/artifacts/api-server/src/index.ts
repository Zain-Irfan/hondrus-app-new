import { seedIfEmpty } from "@workspace/db/seed";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  const pk = process.env.CLERK_PUBLISHABLE_KEY ?? "";
  let pkInstance: string | null = null;
  try {
    pkInstance = Buffer.from(pk.replace(/^pk_(test|live)_/, ""), "base64")
      .toString("utf8")
      .replace(/\$$/, "");
  } catch {
    pkInstance = null;
  }
  logger.info(
    {
      port,
      clerkPkPrefix: pk.slice(0, 11),
      clerkPkInstance: pkInstance,
      clerkSkPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 8) ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    },
    "Server listening",
  );
  void seedIfEmpty();
});
