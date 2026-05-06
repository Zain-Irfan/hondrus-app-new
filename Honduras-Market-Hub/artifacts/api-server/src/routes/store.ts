import { Router, type IRouter, type Request } from "express";
import { eq, asc } from "drizzle-orm";
import { db, productsTable, categoriesTable, shippingMethodsTable } from "@workspace/db";
import { EstimateShippingBody } from "@workspace/api-zod";
import { getFreeShippingThreshold } from "../settings";

const router: IRouter = Router();

function toAbsoluteUrl(req: Request, path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const forwardedHost = (req.get("x-forwarded-host") ?? req.get("host") ?? "").split(",")[0]?.trim();
  const forwardedProto = (req.get("x-forwarded-proto") ?? req.protocol ?? "https").split(",")[0]?.trim();
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}${path}`;
  const domain = process.env["REPLIT_DEV_DOMAIN"];
  if (domain) return `https://${domain}${path}`;
  return path;
}

function parseProduct(req: Request, p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    imageUrl: toAbsoluteUrl(req, p.imageUrl),
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity,
    weight: Number(p.weight),
    origin: p.origin,
    tags: JSON.parse(p.tags) as string[],
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
  };
}

router.get("/store/featured", async (req, res) => {
  try {
    const allProducts = await db.select().from(productsTable);
    const allCategories = await db.select().from(categoriesTable);

    const bestsellers = allProducts.filter(p => p.isBestseller).slice(0, 8).map((p) => parseProduct(req, p));
    const featured = allProducts.filter(p => p.isFeatured).slice(0, 6).map((p) => parseProduct(req, p));
    const newArrivals = allProducts.slice(0, 4).map((p) => parseProduct(req, p));

    res.json({
      bestsellers,
      featured,
      newArrivals,
      totalProducts: allProducts.length,
      totalCategories: allCategories.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting featured products");
    res.status(500).json({ error: "internal_error", message: "Failed to get featured products" });
  }
});

// Public shipping configuration: a single standard rate + free-shipping threshold.
// Storefront UIs call this so the displayed total always matches what the server
// will charge, even if the admin changes the threshold.
router.get("/store/shipping-config", async (_req, res) => {
  try {
    const freeShippingThreshold = await getFreeShippingThreshold();
    res.json({ standardRate: 9.99, freeShippingThreshold });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to load shipping config" });
  }
});

router.post("/store/shipping-estimate", async (req, res) => {
  try {
    const body = EstimateShippingBody.parse(req.body);
    const { orderSubtotal } = body;

    const methods = await db
      .select()
      .from(shippingMethodsTable)
      .where(eq(shippingMethodsTable.active, true))
      .orderBy(asc(shippingMethodsTable.sortOrder), asc(shippingMethodsTable.id));

    const options = methods.map((m) => ({
      carrier: m.carrier,
      service: m.service,
      estimatedDays: m.estimatedDays,
      price: Number(m.price),
    }));

    const freeShippingThreshold = await getFreeShippingThreshold();
    const freeShippingEligible = orderSubtotal >= freeShippingThreshold;

    if (freeShippingEligible && options.length > 0) {
      options[0].price = 0;
    }

    res.json({ options, freeShippingEligible, freeShippingThreshold });
  } catch (err) {
    req.log.error({ err }, "Error estimating shipping");
    res.status(500).json({ error: "internal_error", message: "Failed to estimate shipping" });
  }
});

export default router;
