import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db, appSettingsTable } from '@workspace/db';

const STRIPE_PUBLISHABLE_KEY = 'stripe_publishable_key';
const STRIPE_SECRET_KEY = 'stripe_secret_key';

async function getKeysFromDb(): Promise<{ publishableKey: string; secretKey: string } | null> {
  const rows = await db.select().from(appSettingsTable);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const publishableKey = map.get(STRIPE_PUBLISHABLE_KEY) ?? '';
  const secretKey = map.get(STRIPE_SECRET_KEY) ?? '';
  if (publishableKey && secretKey) return { publishableKey, secretKey };
  return null;
}

async function getKeysFromIntegration(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Stripe is not configured. Add your Stripe API keys in the admin panel under Settings.');
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'X-Replit-Token': xReplitToken },
  });

  const data = await response.json();
  const conn = data.items?.[0];

  if (!conn || !conn.settings?.publishable || !conn.settings?.secret) {
    throw new Error('Stripe is not configured. Add your Stripe API keys in the admin panel under Settings.');
  }

  return { publishableKey: conn.settings.publishable, secretKey: conn.settings.secret };
}

async function getCredentials() {
  const fromDb = await getKeysFromDb();
  if (fromDb) return fromDb;
  return getKeysFromIntegration();
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: '2025-08-27.basil' as any });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export async function setStripeKeys(publishableKey: string, secretKey: string) {
  const entries = [
    { key: STRIPE_PUBLISHABLE_KEY, value: publishableKey },
    { key: STRIPE_SECRET_KEY, value: secretKey },
  ];
  for (const e of entries) {
    await db
      .insert(appSettingsTable)
      .values({ key: e.key, value: e.value })
      .onConflictDoUpdate({ target: appSettingsTable.key, set: { value: e.value, updatedAt: new Date() } });
  }
  stripeSync = null;
}

export async function getStripeKeysStatus() {
  const fromDb = await getKeysFromDb();
  if (fromDb) {
    return {
      configured: true,
      source: 'admin' as const,
      publishableKeyMasked: maskKey(fromDb.publishableKey),
      secretKeySet: true,
    };
  }
  try {
    const fromInt = await getKeysFromIntegration();
    return {
      configured: true,
      source: 'integration' as const,
      publishableKeyMasked: maskKey(fromInt.publishableKey),
      secretKeySet: true,
    };
  } catch {
    return { configured: false, source: 'none' as const, publishableKeyMasked: '', secretKeySet: false };
  }
}

function maskKey(k: string): string {
  if (!k) return '';
  if (k.length <= 12) return k;
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
