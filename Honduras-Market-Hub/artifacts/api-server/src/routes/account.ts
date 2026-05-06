import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/account/profile", requireAuth, async (req, res) => {
  try {
    const email = req.userEmail!;
    let [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));

    if (!customer) {
      const username = email.split("@")[0] ?? email;
      const defaultName = username.charAt(0).toUpperCase() + username.slice(1).replace(/[._-]/g, " ");
      [customer] = await db.insert(customersTable).values({
        name: defaultName,
        email,
        phone: "",
        defaultAddressJson: "{}",
        orderCount: 0,
      }).returning();
    }

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      defaultAddress: customer.defaultAddressJson !== "{}" ? JSON.parse(customer.defaultAddressJson) : undefined,
      orderCount: customer.orderCount,
      joinedAt: customer.joinedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting profile");
    res.status(500).json({ error: "internal_error", message: "Failed to get profile" });
  }
});

router.put("/account/profile", requireAuth, async (req, res) => {
  try {
    const email = req.userEmail!;
    const body = UpdateProfileBody.parse(req.body);

    const [existing] = await db.select().from(customersTable).where(eq(customersTable.email, email));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Profile not found" });
      return;
    }

    const updates: Partial<typeof customersTable.$inferInsert> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.defaultAddress !== undefined) updates.defaultAddressJson = JSON.stringify(body.defaultAddress);

    const [updated] = await db.update(customersTable)
      .set(updates)
      .where(eq(customersTable.email, email))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      defaultAddress: updated.defaultAddressJson !== "{}" ? JSON.parse(updated.defaultAddressJson) : undefined,
      orderCount: updated.orderCount,
      joinedAt: updated.joinedAt.toISOString(),
    });
  } catch (err: any) {
    if (Array.isArray(err?.errors)) {
      res.status(400).json({ error: "validation_error", message: err.errors.map((e: any) => `${e.path?.join(".")}: ${e.message}`).join(", ") });
      return;
    }
    req.log.error({ err }, "Error updating profile");
    res.status(500).json({ error: "internal_error", message: "Failed to update profile" });
  }
});

export default router;
