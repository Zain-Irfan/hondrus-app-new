import { pgTable, serial, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("pending"),
  itemsJson: text("items_json").notNull().default("[]"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddressJson: text("shipping_address_json").notNull().default("{}"),
  shippingCarrier: text("shipping_carrier").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  shippingOptionId: text("shipping_option_id").notNull().default(""),
  estimatedDelivery: text("estimated_delivery").notNull().default(""),
  // Guest checkout: orders placed without an account carry a per-device guest token.
  // When the device's user later signs in, /orders/claim attaches these orders
  // to their account by rewriting customerEmail and clearing guestToken.
  guestToken: text("guest_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  guestTokenIdx: index("orders_guest_token_idx").on(t.guestToken),
}));

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
