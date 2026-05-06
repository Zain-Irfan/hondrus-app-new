import { Router, type IRouter } from "express";
import { getStripePublishableKey } from "../stripeClient";

const router: IRouter = Router();

router.get("/payment/page/:paymentIntentId", async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    const { paymentIntentId } = req.params;
    const orderNumber = req.query.order ?? "";
    const total = req.query.total ?? "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Seguro — Sabores de Honduras</title>
  <script src="https://js.stripe.com/v3/"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f6fb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 32px 28px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eef0f5;
    }
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #002B7F;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .brand { font-size: 16px; font-weight: 700; color: #002B7F; }
    .brand-sub { font-size: 12px; color: #6b7280; }
    .order-info {
      background: #f8f9ff;
      border: 1px solid #e8eaf6;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .order-info .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .order-info .amount { font-size: 28px; font-weight: 800; color: #002B7F; }
    .order-info .order-num { font-size: 13px; color: #374151; margin-top: 4px; }
    #payment-element { margin-bottom: 20px; }
    #submit {
      background: #002B7F;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 16px;
      font-size: 17px;
      font-weight: 700;
      width: 100%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.2s;
    }
    #submit:disabled { opacity: 0.65; cursor: not-allowed; }
    #submit:hover:not(:disabled) { opacity: 0.9; }
    #error-msg {
      margin-top: 14px;
      padding: 12px 14px;
      background: #fff5f5;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 14px;
      display: none;
    }
    #success-screen {
      text-align: center;
      padding: 20px 0;
      display: none;
    }
    #success-screen .check { font-size: 64px; margin-bottom: 16px; }
    #success-screen h2 { font-size: 24px; font-weight: 800; color: #002B7F; margin-bottom: 8px; }
    #success-screen p { color: #6b7280; font-size: 15px; line-height: 1.5; }
    #success-screen .order-badge {
      display: inline-block;
      background: #002B7F;
      color: white;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
    }
    .security-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
      justify-content: center;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">🌽</div>
      <div>
        <div class="brand">Sabores de Honduras</div>
        <div class="brand-sub">Pago seguro con Stripe</div>
      </div>
    </div>

    <div id="payment-form">
      <div class="order-info">
        <div class="label">Total a pagar</div>
        <div class="amount">${total}</div>
        ${orderNumber ? `<div class="order-num">Pedido #${orderNumber}</div>` : ""}
      </div>

      <div id="payment-element"></div>
      <button id="submit" disabled>
        <span id="btn-text"><div class="spinner"></div> Cargando...</span>
      </button>
      <div id="error-msg"></div>
      <div class="security-note">
        🔒 Cifrado SSL · Procesado por Stripe
      </div>
    </div>

    <div id="success-screen">
      <div class="check">✅</div>
      <h2>¡Pago exitoso!</h2>
      <p>Tu pedido ha sido confirmado y será enviado pronto.</p>
      ${orderNumber ? `<div class="order-badge">Pedido #${orderNumber}</div>` : ""}
      <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">Puedes cerrar esta ventana y volver a la aplicación.</p>
    </div>
  </div>

  <script>
    const stripe = Stripe('${publishableKey}');
    let stripeElements = null;

    function showSuccess() {
      document.getElementById('payment-form').style.display = 'none';
      document.getElementById('success-screen').style.display = 'block';
    }

    function showError(msg) {
      const el = document.getElementById('error-msg');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function setSubmitReady() {
      const btn = document.getElementById('submit');
      const btnText = document.getElementById('btn-text');
      btn.disabled = false;
      btnText.innerHTML = '🔒 Confirmar Pago';
    }

    document.getElementById('submit').addEventListener('click', async () => {
      if (!stripeElements) return;
      const btn = document.getElementById('submit');
      const btnText = document.getElementById('btn-text');
      btn.disabled = true;
      btnText.innerHTML = '<div class="spinner"></div> Procesando...';
      document.getElementById('error-msg').style.display = 'none';

      const { error } = await stripe.confirmPayment({
        elements: stripeElements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required'
      });

      if (error) {
        showError(error.message);
        btn.disabled = false;
        btnText.innerHTML = '🔒 Confirmar Pago';
      } else {
        showSuccess();
      }
    });

    async function init() {
      try {
        // Handle 3DS redirect return
        const url = new URL(window.location.href);
        const pi = url.searchParams.get('payment_intent');
        const piSecret = url.searchParams.get('payment_intent_client_secret');
        if (pi && piSecret) {
          const { paymentIntent } = await stripe.retrievePaymentIntent(piSecret);
          if (paymentIntent && paymentIntent.status === 'succeeded') {
            showSuccess();
            return;
          }
        }

        const res = await fetch('/api/payment/intent-secret/${paymentIntentId}');
        if (!res.ok) {
          showError('No se pudo cargar el formulario de pago. Por favor intenta de nuevo.');
          return;
        }
        const { clientSecret, status } = await res.json();
        if (status === 'succeeded') {
          showSuccess();
          return;
        }

        stripeElements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#002B7F', borderRadius: '12px' }
          }
        });

        const paymentElement = stripeElements.create('payment', {
          layout: 'tabs',
          paymentMethodOrder: ['card', 'paypal']
        });
        paymentElement.mount('#payment-element');
        paymentElement.on('ready', setSubmitReady);
      } catch (err) {
        showError('Error al cargar el formulario. Por favor recarga la página.');
      }
    }

    init();
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err: any) {
    res.status(500).send("Payment page unavailable");
  }
});

// Returns client secret for the payment page JS to use
router.get("/payment/intent-secret/:id", async (req, res) => {
  try {
    const { getUncachableStripeClient } = await import("../stripeClient");
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({
      clientSecret: intent.client_secret,
      status: intent.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

export default router;
