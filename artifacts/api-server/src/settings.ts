import { db, appSettingsTable } from "@workspace/db";

const FREE_SHIPPING_THRESHOLD_KEY = "free_shipping_threshold";
const DEFAULT_FREE_SHIPPING_THRESHOLD = 75;

export async function getFreeShippingThreshold(): Promise<number> {
  const rows = await db.select().from(appSettingsTable);
  const row = rows.find((r) => r.key === FREE_SHIPPING_THRESHOLD_KEY);
  if (!row) return DEFAULT_FREE_SHIPPING_THRESHOLD;
  const n = Number(row.value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_FREE_SHIPPING_THRESHOLD;
  return n;
}

export async function setFreeShippingThreshold(value: number): Promise<number> {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Threshold must be a non-negative number");
  }
  const rounded = Math.round(value * 100) / 100;
  await db
    .insert(appSettingsTable)
    .values({ key: FREE_SHIPPING_THRESHOLD_KEY, value: String(rounded) })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value: String(rounded), updatedAt: new Date() },
    });
  return rounded;
}
