import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, ordersTable, categoriesTable, shippingMethodsTable } from "@workspace/db";
import { asc } from "drizzle-orm";
import { setStripeKeys, getStripeKeysStatus } from "../stripeClient";

function normalizeTags(tags: unknown): string {
  if (Array.isArray(tags)) return JSON.stringify(tags);
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
    } catch {
      return "[]";
    }
  }
  return "[]";
}

const router: IRouter = Router();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const provided = req.headers["x-admin-key"] as string | undefined;
  if (!provided || provided !== adminPassword) {
    res.status(401).json({ error: "unauthorized", message: "Clave de administrador incorrecta" });
    return;
  }
  next();
}

router.use("/admin", adminAuth);

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get("/admin/stats", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    const orders = await db.select().from(ordersTable);
    const categories = await db.select().from(categoriesTable);

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    }

    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCategories: categories.length,
      totalRevenue,
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length,
      statusCounts,
      recentOrders: orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt,
        })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "internal_error", message: "Error al obtener estadísticas" });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
router.get("/admin/products", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json(products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      isBestseller: p.isBestseller,
      isFeatured: p.isFeatured,
      inStock: p.inStock,
      stockQuantity: p.stockQuantity,
      origin: p.origin,
      weight: Number(p.weight),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching admin products");
    res.status(500).json({ error: "internal_error", message: "Error al obtener productos" });
  }
});

router.post("/admin/products", async (req, res) => {
  try {
    const {
      name, slug, description, price, imageUrl, categoryId, categoryName,
      isBestseller, isFeatured, inStock, stockQuantity, origin, weight, tags, rating, reviewCount
    } = req.body;

    const [created] = await db.insert(productsTable).values({
      name, slug, description,
      price: String(price),
      imageUrl: imageUrl ?? "",
      categoryId: Number(categoryId),
      categoryName: categoryName ?? "",
      isBestseller: Boolean(isBestseller),
      isFeatured: Boolean(isFeatured),
      inStock: inStock !== false,
      stockQuantity: Number(stockQuantity ?? 100),
      origin: origin ?? "Honduras",
      weight: String(weight ?? "0.50"),
      tags: normalizeTags(tags),
      rating: String(rating ?? "4.50"),
      reviewCount: Number(reviewCount ?? 0),
    }).returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "internal_error", message: "Error al crear producto" });
  }
});

router.put("/admin/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name, description, price, imageUrl, categoryId, categoryName,
      isBestseller, isFeatured, inStock, stockQuantity, origin, weight
    } = req.body;

    const updates: Partial<typeof productsTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = String(price);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (categoryId !== undefined) updates.categoryId = Number(categoryId);
    if (categoryName !== undefined) updates.categoryName = categoryName;
    if (isBestseller !== undefined) updates.isBestseller = Boolean(isBestseller);
    if (isFeatured !== undefined) updates.isFeatured = Boolean(isFeatured);
    if (inStock !== undefined) updates.inStock = Boolean(inStock);
    if (weight !== undefined) updates.weight = String(weight);
    if (stockQuantity !== undefined) updates.stockQuantity = Number(stockQuantity);
    if (origin !== undefined) updates.origin = origin;

    const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Producto no encontrado" });
      return;
    }

    res.json({ id: updated.id, name: updated.name, price: Number(updated.price), inStock: updated.inStock });
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "internal_error", message: "Error al actualizar producto" });
  }
});

router.delete("/admin/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();

    if (!deleted) {
      res.status(404).json({ error: "not_found", message: "Producto no encontrado" });
      return;
    }

    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "internal_error", message: "Error al eliminar producto" });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);
    res.json(orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        status: o.status,
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shippingCost),
        total: Number(o.total),
        shippingCarrier: o.shippingCarrier,
        trackingNumber: o.trackingNumber,
        estimatedDelivery: o.estimatedDelivery,
        items: JSON.parse(o.itemsJson),
        shippingAddress: JSON.parse(o.shippingAddressJson),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })));
  } catch (err) {
    req.log.error({ err }, "Error fetching admin orders");
    res.status(500).json({ error: "internal_error", message: "Error al obtener pedidos" });
  }
});

router.put("/admin/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, trackingNumber, shippingCarrier, estimatedDelivery } = req.body;

    const updates: Partial<typeof ordersTable.$inferInsert> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (shippingCarrier !== undefined) updates.shippingCarrier = shippingCarrier;
    if (estimatedDelivery !== undefined) updates.estimatedDelivery = estimatedDelivery;

    const [updated] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Pedido no encontrado" });
      return;
    }

    res.json({
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      trackingNumber: updated.trackingNumber,
      shippingCarrier: updated.shippingCarrier,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating order");
    res.status(500).json({ error: "internal_error", message: "Error al actualizar pedido" });
  }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
router.get("/admin/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable);
    res.json(cats);
  } catch (err) {
    req.log.error({ err }, "Error fetching admin categories");
    res.status(500).json({ error: "internal_error", message: "Error al obtener categorías" });
  }
});

router.post("/admin/categories", async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "bad_request", message: "Nombre y slug son requeridos" });
      return;
    }
    const [created] = await db.insert(categoriesTable).values({
      name,
      slug,
      description: description ?? "",
      imageUrl: imageUrl ?? "",
      productCount: 0,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Error creating category");
    res.status(500).json({ error: "internal_error", message: "Error al crear categoría" });
  }
});

router.put("/admin/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, description, imageUrl } = req.body;
    const updates: Partial<typeof categoriesTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    const [updated] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Categoría no encontrada" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating category");
    res.status(500).json({ error: "internal_error", message: "Error al actualizar categoría" });
  }
});

// ─── SHIPPING METHODS ─────────────────────────────────────────────────────────
function parseShippingBody(body: any) {
  const carrier = String(body?.carrier ?? "").trim();
  const service = String(body?.service ?? "").trim();
  const priceNum = Number(body?.price);
  const estimatedDays = Number(body?.estimatedDays);
  const sortOrder = Number(body?.sortOrder ?? 0);
  const active = body?.active !== false;
  if (!carrier || !service) return { error: "El transportista y el servicio son obligatorios" };
  if (!Number.isFinite(priceNum) || priceNum < 0) return { error: "El precio debe ser un número positivo" };
  if (!Number.isInteger(estimatedDays) || estimatedDays < 0) return { error: "Los días deben ser un entero positivo" };
  return {
    data: {
      carrier,
      service,
      price: priceNum.toFixed(2),
      estimatedDays,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      active,
    },
  };
}

router.get("/admin/shipping-methods", async (req, res) => {
  try {
    const methods = await db.select().from(shippingMethodsTable).orderBy(asc(shippingMethodsTable.sortOrder), asc(shippingMethodsTable.id));
    res.json(methods.map((m) => ({ ...m, price: Number(m.price) })));
  } catch (err) {
    req.log.error({ err }, "Error listing shipping methods");
    res.status(500).json({ error: "internal_error", message: "Error al listar métodos de envío" });
  }
});

router.post("/admin/shipping-methods", async (req, res) => {
  try {
    const parsed = parseShippingBody(req.body);
    if ("error" in parsed) {
      res.status(400).json({ error: "invalid_input", message: parsed.error });
      return;
    }
    const [created] = await db.insert(shippingMethodsTable).values(parsed.data).returning();
    res.json({ ...created, price: Number(created.price) });
  } catch (err) {
    req.log.error({ err }, "Error creating shipping method");
    res.status(500).json({ error: "internal_error", message: "Error al crear método de envío" });
  }
});

router.put("/admin/shipping-methods/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = parseShippingBody(req.body);
    if ("error" in parsed) {
      res.status(400).json({ error: "invalid_input", message: parsed.error });
      return;
    }
    const [updated] = await db.update(shippingMethodsTable).set(parsed.data).where(eq(shippingMethodsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Método de envío no encontrado" });
      return;
    }
    res.json({ ...updated, price: Number(updated.price) });
  } catch (err) {
    req.log.error({ err }, "Error updating shipping method");
    res.status(500).json({ error: "internal_error", message: "Error al actualizar método de envío" });
  }
});

router.delete("/admin/shipping-methods/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(shippingMethodsTable).where(eq(shippingMethodsTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "not_found", message: "Método de envío no encontrado" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting shipping method");
    res.status(500).json({ error: "internal_error", message: "Error al eliminar método de envío" });
  }
});

// ─── SETTINGS: STRIPE KEYS ────────────────────────────────────────────────────
router.get("/admin/settings/stripe", async (req, res) => {
  try {
    const status = await getStripeKeysStatus();
    res.json(status);
  } catch (err) {
    req.log.error({ err }, "Error reading stripe settings");
    res.status(500).json({ error: "internal_error", message: "Error al leer la configuración" });
  }
});

router.put("/admin/settings/stripe", async (req, res) => {
  try {
    const { publishableKey, secretKey } = req.body ?? {};
    if (typeof publishableKey !== "string" || typeof secretKey !== "string" || !publishableKey.trim() || !secretKey.trim()) {
      res.status(400).json({ error: "invalid_input", message: "Both publishable and secret keys are required" });
      return;
    }
    const pk = publishableKey.trim();
    const sk = secretKey.trim();
    if (!pk.startsWith("pk_")) {
      res.status(400).json({ error: "invalid_input", message: "Publishable key must start with pk_" });
      return;
    }
    if (!sk.startsWith("sk_") && !sk.startsWith("rk_")) {
      res.status(400).json({ error: "invalid_input", message: "Secret key must start with sk_ or rk_" });
      return;
    }
    await setStripeKeys(pk, sk);
    const status = await getStripeKeysStatus();
    res.json(status);
  } catch (err) {
    req.log.error({ err }, "Error saving stripe settings");
    res.status(500).json({ error: "internal_error", message: "Error al guardar la configuración" });
  }
});

// ─── SETTINGS: FREE SHIPPING THRESHOLD ───────────────────────────────────────
router.get("/admin/settings/free-shipping", async (_req, res) => {
  try {
    const { getFreeShippingThreshold } = await import("../settings");
    const threshold = await getFreeShippingThreshold();
    res.json({ threshold });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Error al leer el umbral" });
  }
});

router.put("/admin/settings/free-shipping", async (req, res) => {
  try {
    const { threshold } = req.body ?? {};
    const n = Number(threshold);
    if (!Number.isFinite(n) || n < 0) {
      res.status(400).json({ error: "invalid_input", message: "Threshold must be a non-negative number" });
      return;
    }
    const { setFreeShippingThreshold } = await import("../settings");
    const saved = await setFreeShippingThreshold(n);
    res.json({ threshold: saved });
  } catch (err) {
    req.log.error({ err }, "Error saving free-shipping threshold");
    res.status(500).json({ error: "internal_error", message: "Error al guardar el umbral" });
  }
});

// ─── CLERK USER MFA RESET ─────────────────────────────────────────────────────
// One-shot tool to disable 2FA on a user account that got locked into MFA.
router.post("/admin/clerk-disable-mfa", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "bad_request", message: "Falta el email" });
      return;
    }
    const sk = process.env.CLERK_SECRET_KEY;
    if (!sk) {
      res.status(500).json({ error: "missing_secret", message: "CLERK_SECRET_KEY no configurada" });
      return;
    }
    const lookup = await fetch(
      `https://api.clerk.com/v1/users?email_address[]=${encodeURIComponent(email)}&limit=10`,
      { headers: { Authorization: `Bearer ${sk}` } },
    );
    if (!lookup.ok) {
      const txt = await lookup.text();
      res.status(502).json({ error: "clerk_lookup_failed", status: lookup.status, body: txt });
      return;
    }
    const users = (await lookup.json()) as Array<{ id: string; email_addresses?: Array<{ email_address?: string }>; two_factor_enabled?: boolean; totp_enabled?: boolean; backup_code_enabled?: boolean }>;
    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: "user_not_found", message: `No hay usuario con email ${email} en Clerk` });
      return;
    }
    const results: Array<Record<string, unknown>> = [];
    for (const u of users) {
      const before = {
        id: u.id,
        email: u.email_addresses?.[0]?.email_address,
        two_factor_enabled: u.two_factor_enabled,
        totp_enabled: u.totp_enabled,
        backup_code_enabled: u.backup_code_enabled,
      };
      const del = await fetch(`https://api.clerk.com/v1/users/${u.id}/mfa`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sk}` },
      });
      const delBody = del.ok ? await del.json().catch(() => ({})) : await del.text();
      results.push({ before, deleteStatus: del.status, deleteBody: delBody });
    }
    res.json({ success: true, results });
  } catch (err) {
    req.log.error({ err }, "clerk-disable-mfa failed");
    res.status(500).json({ error: "internal_error", message: String((err as Error)?.message ?? err) });
  }
});

router.delete("/admin/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "not_found", message: "Categoría no encontrada" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting category");
    res.status(500).json({ error: "internal_error", message: "Error al eliminar categoría" });
  }
});

export default router;
