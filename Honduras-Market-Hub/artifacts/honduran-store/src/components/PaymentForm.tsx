import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface BillingDefaults {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface PaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  returnUrl: string;
  billingDefaults?: BillingDefaults;
}

export function PaymentForm({ onSuccess, onError, submitting, setSubmitting, returnUrl, billingDefaults }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMsg(null);
    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: billingDefaults
          ? { billing_details: billingDefaults }
          : undefined,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Payment failed");
      onError(error.message ?? "Payment failed");
      setSubmitting(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMsg("Unexpected payment status. Please try again.");
      onError("Unexpected payment status");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "paypal"],
          defaultValues: billingDefaults ? { billingDetails: billingDefaults } : undefined,
          fields: {
            billingDetails: {
              name: "auto",
              email: "auto",
              phone: "never",
              address: "auto",
            },
          },
          wallets: {
            applePay: "never",
            googlePay: "never",
          },
        }}
      />
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {errorMsg}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || submitting}
        size="lg"
        className="w-full h-14 text-lg rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg"
      >
        {submitting ? (
          <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {t.checkout.processingPayment}</span>
        ) : (
          <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t.checkout.confirmAndPay}</span>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> {t.checkout.sslNote}
      </p>
    </form>
  );
}
