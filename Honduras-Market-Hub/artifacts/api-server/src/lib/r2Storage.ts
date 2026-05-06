import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let cachedClient: S3Client | null = null;
function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const accountId = requireEnv("R2_ACCOUNT_ID");
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

export function getBucketName(): string {
  return requireEnv("R2_BUCKET_NAME");
}

export function getPublicBaseUrl(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
}

export async function createPresignedUploadUrl(opts: {
  contentType: string;
  extension?: string;
}): Promise<{ uploadURL: string; key: string }> {
  const client = getClient();
  const id = randomUUID();
  const ext = opts.extension ? `.${opts.extension.replace(/^\./, "")}` : "";
  const key = `objects/${id}${ext}`;
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: opts.contentType,
  });
  const uploadURL = await getSignedUrl(client, command, { expiresIn: 60 * 15 });
  return { uploadURL, key };
}

export function publicUrlForKey(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `${getPublicBaseUrl()}/${cleanKey}`;
}

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}
