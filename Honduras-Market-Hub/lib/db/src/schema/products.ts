import { pgTable, serial, text, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull().default(""),
  categoryId: integer("category_id").notNull(),
  categoryName: text("category_name").notNull().default(""),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  stockQuantity: integer("stock_quantity").notNull().default(100),
  weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("1.00"),
  origin: text("origin").notNull().default("Honduras"),
  tags: text("tags").notNull().default("[]"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.50"),
  reviewCount: integer("review_count").notNull().default(0),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
