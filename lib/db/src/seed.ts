import { sql } from "drizzle-orm";
import { db } from "./index";
import { categoriesTable } from "./schema/categories";
import { productsTable } from "./schema/products";
import { shippingMethodsTable } from "./schema/shipping_methods";
import seedData from "./seedData.json" with { type: "json" };

type RawCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count: number | null;
};

type RawProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  category_id: number;
  category_name: string | null;
  is_bestseller: boolean | null;
  is_featured: boolean | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  weight: string | number | null;
  origin: string | null;
  tags: unknown;
  rating: string | number | null;
  review_count: number | null;
};

export async function seedIfEmpty(): Promise<void> {
  const data = seedData as { categories: RawCategory[]; products: RawProduct[] };

  // Categories — insert if empty
  try {
    const existingCats = await db.select({ id: categoriesTable.id }).from(categoriesTable).limit(1);
    if (existingCats.length === 0 && data.categories.length > 0) {
      await db.insert(categoriesTable).values(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          imageUrl: c.image_url ?? "",
          productCount: c.product_count ?? 0,
        })),
      );
      const maxCatId = Math.max(...data.categories.map((c) => c.id));
      await db.execute(sql`SELECT setval('categories_id_seq', ${maxCatId})`);
      console.log(`[seed] Inserted ${data.categories.length} categories.`);
    }
  } catch (err) {
    console.error("[seed] Failed to seed categories:", err);
  }

  // Products — insert if empty
  try {
    const existingProds = await db.select({ id: productsTable.id }).from(productsTable).limit(1);
    if (existingProds.length === 0 && data.products.length > 0) {
      await db.insert(productsTable).values(
        data.products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description ?? "",
          price: String(p.price),
          imageUrl: p.image_url ?? "",
          categoryId: p.category_id,
          categoryName: p.category_name ?? "",
          isBestseller: p.is_bestseller ?? false,
          isFeatured: p.is_featured ?? false,
          inStock: p.in_stock ?? true,
          stockQuantity: p.stock_quantity ?? 100,
          weight: p.weight != null ? String(p.weight) : "1.00",
          origin: p.origin ?? "Honduras",
          tags: typeof p.tags === "string" ? p.tags : JSON.stringify(p.tags ?? []),
          rating: p.rating != null ? String(p.rating) : "4.50",
          reviewCount: p.review_count ?? 0,
        })),
      );
      const maxProdId = Math.max(...data.products.map((p) => p.id));
      await db.execute(sql`SELECT setval('products_id_seq', ${maxProdId})`);
      console.log(`[seed] Inserted ${data.products.length} products.`);
    }
  } catch (err) {
    console.error("[seed] Failed to seed products:", err);
  }

  // Shipping methods — insert if empty
  try {
    const existing = await db.select({ id: shippingMethodsTable.id }).from(shippingMethodsTable).limit(1);
    if (existing.length === 0) {
      await db.insert(shippingMethodsTable).values([
        { carrier: "UPS", service: "UPS Ground", price: "9.99", estimatedDays: 5, sortOrder: 1, active: true },
        { carrier: "UPS", service: "UPS 3-Day Select", price: "16.99", estimatedDays: 3, sortOrder: 2, active: true },
        { carrier: "FedEx", service: "FedEx Ground", price: "10.99", estimatedDays: 5, sortOrder: 3, active: true },
        { carrier: "FedEx", service: "FedEx 2Day", price: "22.99", estimatedDays: 2, sortOrder: 4, active: true },
      ]);
      console.log("[seed] Inserted default shipping methods.");
    }
  } catch (err) {
    console.error("[seed] Failed to seed shipping methods:", err);
  }
}
