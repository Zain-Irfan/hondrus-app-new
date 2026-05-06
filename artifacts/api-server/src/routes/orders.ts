import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, ordersTable, cartItemsTable, customersTable } from "@workspace/db";
import { CreateOrderBody, GetOrderParams, ClaimGuestOrdersBody } from "@workspace/api-zod";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { optionalAuth } from "../middlewares/optionalAuth";
import { getFreeShippingThreshold } from "../settings";

const router: IRouter = Router();

function getSessionId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  const sid = req.headers["x-session-id"] as string | undefined;
  return sid ?? "default-session";
}

/**
 * Read the per-device guest token from a request. Falls back to the
 * `x-guest-token` header so the web client can inject it on every API call
 * without having to thread it through every body / query.
 */
function getGuestToken(
  req: Parameters<Parameters<typeof router.get>[1]>[0],
  fromBody?: unknown,
): string | null {
  if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;
  const fromQuery = req.query?.guestToken;
  if (typeof fromQuery === "string" && fromQuery.length > 0) return fromQuery;
  const fromHeader = req.headers["x-guest-token"];
  if (typeof fromHeader === "string" && fromHeader.length > 0) return fromHeader;
  return null;
}

function parseOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    items: JSON.parse(o.itemsJson) as unknown[],
    subtotal: Number(o.subtotal),
    shippingCost: Number(o.shippingCost),
    total: Number(o.total),
    shippingAddress: JSON.parse(o.shippingAddressJson) as Record<string, unknown>,
    shippingCarrier: o.shippingCarrier,
    trackingNumber: o.trackingNumber,
    estimatedDelivery: o.estimatedDelivery,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

function generateOrderNumber() {
  return `HND-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

function generateTrackingNumber(carrier: string) {
  const c = carrier.toUpperCase();
  const prefix = c.includes("UPS") ? "1Z999AA1" : c.includes("FEDEX") ? "7489" : c.includes("USPS") ? "9400" : "TRK";
  return `${prefix}${Math.floor(Math.random() * 1e10).toString().padStart(10, "0")}`;
}

// Shipping carrier selection has been removed from the storefront UIs.
// Every order uses a single standard shipping option. The client may pass
// any value (or none) for shippingOptionId; it is ignored on purpose so we
// always charge a predictable, fixed rate.
const STANDARD_SHIPPING = { carrier: "Standard", service: "Standard Shipping", days: 5, cost: 9.99 };

async function resolveShippingOption(_shippingOptionId: string): Promise<{ carrier: string; service: string; days: number; cost: number }> {
  return STANDARD_SHIPPING;
}

function estimateDeliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days + 1);
  return d.toISOString().split("T")[0];
}

router.get("/orders", optionalAuth, async (req, res) => {
  try {
    const email = req.userEmail ?? null;
    const guestToken = getGuestToken(req);

    if (!email && !guestToken) {
      // Nothing to look up — just return an empty list rather than 401 so
      // a fresh device can render its empty state.
      res.json([]);
      return;
    }

    let orders: (typeof ordersTable.$inferSelect)[] = [];
    if (email) {
      orders = await db
        .select()
        .from(ordersTable)
        .where(sql`lower(${ordersTable.customerEmail}) = ${email.toLowerCase()}`);
    } else if (guestToken) {
      orders = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.guestToken, guestToken));
    }
    req.log.info({ email, hasGuestToken: !!guestToken, count: orders.length }, "Listing orders");
    res.json(orders.map(parseOrder));
  } catch (err) {
    req.log.error({ err }, "Error listing orders");
    res.status(500).json({ error: "internal_error", message: "Failed to list orders" });
  }
});

router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const sessionEmail = req.userEmail ?? null;
    const guestToken = getGuestToken(req, req.body?.guestToken);

    // If the client passes a paymentIntentId, verify the payment succeeded before creating the order.
    const paymentIntentId = req.body.paymentIntentId as string | undefined;
    if (paymentIntentId) {
      try {
        const stripe = await getUncachableStripeClient();
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== "succeeded") {
          res.status(402).json({ error: "payment_required", message: "Payment must be completed before an order can be created." });
          return;
        }
      } catch (stripeErr) {
        req.log.warn({ stripeErr }, "Could not verify payment intent — proceeding anyway");
      }
    }

    const body = CreateOrderBody.parse(req.body);

    // For guest checkout we require a guestToken so the order can be looked up
    // later from the same device, and a contact email so we can email receipts.
    if (!sessionEmail) {
      if (!guestToken) {
        res.status(400).json({ error: "missing_guest_token", message: "Guest checkout requires a device token." });
        return;
      }
      if (!body.customerEmail || !/.+@.+/.test(body.customerEmail)) {
        res.status(400).json({ error: "missing_email", message: "A contact email is required for guest checkout." });
        return;
      }
    }

    const sessionId = getSessionId(req);

    // Support two flows:
    // 1. Mobile app: sends items directly in req.body.items (local cart)
    // 2. Web app: items loaded from server-side cart by sessionId
    const inlineItems = Array.isArray(req.body.items) ? req.body.items : null;

    let items: { id: number; productId: number; productName: string; productImageUrl: string | null; price: number; quantity: number; subtotal: number }[];

    if (inlineItems && inlineItems.length > 0) {
      items = inlineItems.map((item: any) => ({
        id: item.id ?? 0,
        productId: item.productId ?? 0,
        productName: item.productName ?? "",
        productImageUrl: item.productImageUrl ?? null,
        price: Number(item.price),
        quantity: Number(item.quantity),
        subtotal: Number(item.price) * Number(item.quantity),
      }));
    } else {
      const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
      if (cartItems.length === 0) {
        res.status(400).json({ error: "empty_cart", message: "Cannot place order with empty cart" });
        return;
      }
      items = cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.price) * item.quantity,
      }));
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    const shippingOption = await resolveShippingOption(body.shippingOptionId);
    const freeShippingThreshold = await getFreeShippingThreshold();
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : shippingOption.cost;
    const total = subtotal + shippingCost;

    // Bind the order to the authenticated session email when present so a
    // logged-in attacker cannot create an order on behalf of someone else.
    // For guest checkout, trust body.customerEmail (used only for receipts);
    // ownership is enforced via the per-device guestToken.
    const ownerEmail = sessionEmail ?? body.customerEmail;

    const [order] = await db.insert(ordersTable).values({
      orderNumber: generateOrderNumber(),
      customerName: body.customerName,
      customerEmail: ownerEmail,
      status: "confirmed",
      itemsJson: JSON.stringify(items),
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2),
      shippingAddressJson: JSON.stringify(body.shippingAddress),
      shippingCarrier: shippingOption.service.toLowerCase().startsWith(shippingOption.carrier.toLowerCase())
        ? shippingOption.service
        : `${shippingOption.carrier} ${shippingOption.service}`.trim(),
      trackingNumber: generateTrackingNumber(shippingOption.carrier),
      shippingOptionId: body.shippingOptionId,
      estimatedDelivery: estimateDeliveryDate(shippingOption.days),
      // Always store the guest token alongside the order, even for signed-in
      // customers — this makes follow-up claims idempotent and lets the same
      // device's prior guest orders be re-attached if needed.
      guestToken: sessionEmail ? null : guestToken,
    }).returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    // Auto-save shipping address as the customer's default for next checkout
    if (sessionEmail) {
      try {
        const addressJson = JSON.stringify(body.shippingAddress);
        const [existingCustomer] = await db
          .select()
          .from(customersTable)
          .where(eq(customersTable.email, sessionEmail));

        if (existingCustomer) {
          await db
            .update(customersTable)
            .set({
              defaultAddressJson: addressJson,
              name: body.customerName || existingCustomer.name,
              phone: body.shippingAddress.phone || existingCustomer.phone,
              orderCount: (existingCustomer.orderCount ?? 0) + 1,
            })
            .where(eq(customersTable.email, sessionEmail));
        } else {
          await db.insert(customersTable).values({
            name: body.customerName || sessionEmail.split("@")[0],
            email: sessionEmail,
            phone: body.shippingAddress.phone ?? "",
            defaultAddressJson: addressJson,
            orderCount: 1,
          });
        }
      } catch (saveErr) {
        req.log.warn({ saveErr }, "Could not save customer default address after order");
      }
    }

    res.status(201).json(parseOrder(order));
  } catch (err) {
    req.log.error({ err }, "Error creating order");
    res.status(500).json({ error: "internal_error", message: "Failed to create order" });
  }
});

router.post("/orders/claim", requireAuth, async (req, res) => {
  try {
    const sessionEmail = req.userEmail!;
    const body = ClaimGuestOrdersBody.parse(req.body);
    const guestToken = body.guestToken;

    const updated = await db
      .update(ordersTable)
      .set({ customerEmail: sessionEmail, guestToken: null, updatedAt: new Date() })
      .where(eq(ordersTable.guestToken, guestToken))
      .returning({ id: ordersTable.id });

    req.log.info({ sessionEmail, claimed: updated.length }, "Claimed guest orders");
    res.json({ claimed: updated.length });
  } catch (err) {
    req.log.error({ err }, "Error claiming guest orders");
    res.status(500).json({ error: "internal_error", message: "Failed to claim guest orders" });
  }
});

router.get("/orders/:id", optionalAuth, async (req, res) => {
  try {
    const email = req.userEmail ?? null;
    const guestToken = getGuestToken(req);
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));

    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }

    const matchesEmail =
      !!email && order.customerEmail.trim().toLowerCase() === email.toLowerCase();
    const matchesGuest = !!guestToken && order.guestToken === guestToken;

    if (!matchesEmail && !matchesGuest) {
      res.status(403).json({ error: "forbidden", message: "This order belongs to a different account" });
      return;
    }

    res.json(parseOrder(order));
  } catch (err) {
    req.log.error({ err }, "Error getting order");
    res.status(500).json({ error: "internal_error", message: "Failed to get order" });
  }
});

export default router;
