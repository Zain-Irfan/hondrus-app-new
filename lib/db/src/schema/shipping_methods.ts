import { pgTable, serial, text, integer, boolean, decimal } from "drizzle-orm/pg-core";

export const shippingMethodsTable = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  carrier: text("carrier").notNull(),
  service: text("service").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  estimatedDays: integer("estimated_days").notNull().default(5),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export type ShippingMethod = typeof shippingMethodsTable.$inferSelect;
