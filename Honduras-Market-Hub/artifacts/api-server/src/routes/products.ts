import { Router, type IRouter, type Request } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  ListProductsResponse,
  GetProductResponse,
} from "@workspace/api-zod";

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
    tags: (() => { try { const v = JSON.parse(p.tags); return Array.isArray(v) ? v : []; } catch { return []; } })(),
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
  };
}

router.get("/products", async (req, res) => {
  try {
    const query = ListProductsQueryParams.parse(req.query);
    const conditions: SQL[] = [];

    if (query.category) {
      // Look up the category by slug or name (case-insensitive) so the
      // products are filtered by category ID rather than the denormalised
      // categoryName string. This avoids language mismatches (e.g. a product
      // saved with "Bebidas" not matching a slug of "beverages").
      const cats = await db.select().from(categoriesTable);
      const needle = query.category.toLowerCase();
      const match = cats.find(
        (c) =>
          c.slug.toLowerCase() === needle ||
          c.name.toLowerCase() === needle,
      );
      if (match) {
        conditions.push(eq(productsTable.categoryId, match.id));
      } else {
        // Fallback to the previous behaviour so unknown values still try a
        // best-effort substring match instead of silently returning all rows.
        conditions.push(ilike(productsTable.categoryName, `%${query.category}%`));
      }
    }
    if (query.search) {
      conditions.push(ilike(productsTable.name, `%${query.search}%`));
    }
    if (query.featured !== undefined) {
      conditions.push(eq(productsTable.isFeatured, query.featured));
    }
    if (query.bestseller !== undefined) {
      conditions.push(eq(productsTable.isBestseller, query.bestseller));
    }

    const products = conditions.length > 0
      ? await db.select().from(productsTable).where(and(...conditions))
      : await db.select().from(productsTable);

    const parsed = ListProductsResponse.parse(products.map((p) => parseProduct(req, p)));
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "internal_error", message: "Failed to list products" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "not_found", message: "Product not found" });
      return;
    }

    const parsed = GetProductResponse.parse(parseProduct(req, product));
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error getting product");
    res.status(500).json({ error: "internal_error", message: "Failed to get product" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable);
    const parsed = cats.map(c => ({ ...c, imageUrl: toAbsoluteUrl(req, c.imageUrl) }));
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error listing categories");
    res.status(500).json({ error: "internal_error", message: "Failed to list categories" });
  }
});

export default router;
