import { Router, type IRouter } from "express";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";

const router: IRouter = Router();

router.get("/payment/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    res.status(500).json({ error: "stripe_unavailable", message: "Stripe not configured" });
  }
});

router.post("/payment/create-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", orderNumber, customerEmail, paymentMethodTypes } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "invalid_amount", message: "A positive amount (in cents) is required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const methodTypes = paymentMethodTypes ?? ["card"];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      payment_method_types: methodTypes,
      metadata: {
        orderNumber: orderNumber ?? "",
        customerEmail: customerEmail ?? "",
      },
      receipt_email: customerEmail ?? undefined,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    req.log.error({ err }, "Error creating payment intent");
    res.status(500).json({ error: "stripe_error", message: err.message ?? "Failed to create payment" });
  }
});

router.get("/payment/intent/:id", async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({
      id: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
    });
  } catch (err: any) {
    req.log.error({ err }, "Error retrieving payment intent");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

export default router;
