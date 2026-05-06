import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getSessionId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  const sid = req.headers["x-session-id"] as string | undefined;
  return sid ?? "default-session";
}

async function buildCart(sessionId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  const cartItems = items.map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productImageUrl: item.productImageUrl,
    price: Number(item.price),
    quantity: item.quantity,
    subtotal: Number(item.price) * item.quantity,
  }));
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return { items: cartItems, subtotal, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Error getting cart");
    res.status(500).json({ error: "internal_error", message: "Failed to get cart" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const body = AddToCartBody.parse(req.body);

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId));
    if (!product) {
      res.status(404).json({ error: "not_found", message: "Product not found" });
      return;
    }

    const [existing] = await db.select().from(cartItemsTable).where(
      and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, body.productId))
    );

    if (existing) {
      await db.update(cartItemsTable)
        .set({ quantity: existing.quantity + body.quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        price: product.price,
        quantity: body.quantity,
      });
    }

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Error adding to cart");
    res.status(500).json({ error: "internal_error", message: "Failed to add to cart" });
  }
});

router.put("/cart/:itemId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { itemId } = UpdateCartItemParams.parse({ itemId: Number(req.params.itemId) });
    const body = UpdateCartItemBody.parse(req.body);

    if (body.quantity <= 0) {
      await db.delete(cartItemsTable).where(
        and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId))
      );
    } else {
      await db.update(cartItemsTable)
        .set({ quantity: body.quantity })
        .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId)));
    }

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Error updating cart item");
    res.status(500).json({ error: "internal_error", message: "Failed to update cart item" });
  }
});

router.delete("/cart/:itemId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { itemId } = RemoveCartItemParams.parse({ itemId: Number(req.params.itemId) });

    await db.delete(cartItemsTable).where(
      and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId))
    );

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Error removing cart item");
    res.status(500).json({ error: "internal_error", message: "Failed to remove cart item" });
  }
});

router.delete("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    res.json({ items: [], subtotal: 0, itemCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Error clearing cart");
    res.status(500).json({ error: "internal_error", message: "Failed to clear cart" });
  }
});

export default router;
