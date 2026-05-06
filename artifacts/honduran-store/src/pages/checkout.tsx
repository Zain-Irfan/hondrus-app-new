import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCart, useCreateOrder, useClearCart, useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Truck, ChevronRight, CheckCircle2, MapPin, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentForm } from "@/components/PaymentForm";
import { Header } from "@/components/layout/header";
import { useLanguage } from "@/hooks/use-language";
import { useShippingConfig } from "@/hooks/use-shipping-config";
import { AddressAutocomplete, type ParsedAddress } from "@/components/address-autocomplete";
import { useUser, openSignIn } from "@/hooks/use-user";
import { getGuestId } from "@/lib/guestId";

const API_BASE = "/api";

let stripePromiseCache: ReturnType<typeof loadStripe> | null = null;
let stripePromiseKey: string | null = null;

async function loadStripeWithKey(publishableKey: string) {
  if (stripePromiseCache && stripePromiseKey === publishableKey) return stripePromiseCache;
  stripePromiseKey = publishableKey;
  stripePromiseCache = loadStripe(publishableKey);
  return stripePromiseCache;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cart, isLoading: isCartLoading } = useGetCart();
  const { t } = useLanguage();
  const { email: userEmail, user, refreshProfile } = useUser();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "", line1: "", line2: "", city: "", state: "", zipCode: "", phone: ""
  });
  const [customerEmail, setCustomerEmail] = useState(userEmail ?? "");

  useEffect(() => {
    if (userEmail) setCustomerEmail(userEmail);
  }, [userEmail]);

  const [frozenCart, setFrozenCart] = useState<typeof cart | null>(null);
  const activeCart = frozenCart ?? cart;

  // Live shipping config from the server (admin-configurable threshold).
  // Falls back to sensible defaults inside the hook if the call fails.
  const shippingConfig = useShippingConfig();

  const [stripePromiseState, setStripePromiseState] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const createOrder = useCreateOrder();
  const clearCart = useClearCart();

  // Pre-fill from signed-in user profile
  useEffect(() => {
    if (userEmail && step === 1) {
      setCustomerEmail(userEmail);
      if (user?.defaultAddress) {
        setShippingAddress({
          fullName: user.defaultAddress.fullName || user.name || "",
          line1: user.defaultAddress.line1 || "",
          line2: user.defaultAddress.line2 || "",
          city: user.defaultAddress.city || "",
          state: user.defaultAddress.state || "",
          zipCode: user.defaultAddress.zipCode || "",
          phone: user.defaultAddress.phone || "",
        });
      } else if (user?.name) {
        setShippingAddress(prev => ({ ...prev, fullName: user.name }));
      }
    }
  }, [userEmail, user, step]);

  const subtotal = activeCart?.subtotal ?? 0;
  const isFreeShipping = subtotal >= shippingConfig.freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : shippingConfig.standardRate;

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCart) return;
    await proceedToPayment();
  };

  const proceedToPayment = async () => {
    if (!activeCart) return;
    setIsPreparingPayment(true);
    setPaymentError(null);
    try {
      // Freeze the cart snapshot so the order summary stays visible during payment
      setFrozenCart(cart);

      const total = activeCart.subtotal + shippingCost;
      const amountInCents = Math.round(total * 100);

      // Fetch publishable key + create payment intent in parallel.
      // Doing both here (instead of on page mount) guarantees that if one works,
      // the same network/proxy path is used for both — and surfaces real errors.
      const [configRes, intentRes] = await Promise.all([
        fetch(`${API_BASE}/payment/config`),
        fetch(`${API_BASE}/payment/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountInCents, customerEmail }),
        }),
      ]);

      if (!configRes.ok) {
        throw new Error(`Stripe configuration unavailable (HTTP ${configRes.status})`);
      }
      const configData = await configRes.json();
      const publishableKey: string | undefined = configData?.publishableKey;
      if (!publishableKey || typeof publishableKey !== "string" || !publishableKey.startsWith("pk_")) {
        throw new Error("Stripe publishable key is not configured. Add it in the admin panel under Settings.");
      }

      if (!intentRes.ok) {
        const errBody = await intentRes.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `Failed to initialize payment (HTTP ${intentRes.status})`);
      }
      const { clientSecret: cs, paymentIntentId: piId } = await intentRes.json();
      if (!cs) throw new Error("Stripe did not return a client secret");

      // Resolve the Stripe.js loader BEFORE switching to step 3.
      // This avoids a race where Elements is rendered with a still-loading promise.
      const stripeInstance = await loadStripeWithKey(publishableKey);
      if (!stripeInstance) {
        throw new Error("Could not load Stripe.js. Please check your connection and try again.");
      }
      setStripePromiseState(loadStripeWithKey(publishableKey));
      setClientSecret(cs);
      setPaymentIntentId(piId);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const msg = err?.message ?? t.checkout.errorPaymentSub;
      setPaymentError(msg);
      toast({ title: t.checkout.errorPayment, description: msg, variant: "destructive" });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const updateProfile = useUpdateProfile();

  const handlePaymentSuccess = async (confirmedPaymentIntentId: string) => {
    try {
      // Payment succeeded — now create the order
      const order = await createOrder.mutateAsync({
        data: {
          shippingAddress,
          shippingOptionId: "standard",
          customerEmail,
          customerName: shippingAddress.fullName,
          // For guest checkout the per-device token is the ownership key.
          // It's also harmless to send when signed in — server ignores it.
          guestToken: getGuestId(),
          // Pass the paymentIntentId so the server can verify the payment before creating the order
          ...(confirmedPaymentIntentId ? { paymentIntentId: confirmedPaymentIntentId } as any : {}),
        }
      });
      setCreatedOrderId(String(order.id));
      setCreatedOrderNumber(order.orderNumber);

      // Save the address + name + phone to the customer profile so it
      // prefills automatically next time. Best-effort — never block the order.
      try {
        await updateProfile.mutateAsync({
          data: {
            name: shippingAddress.fullName,
            phone: shippingAddress.phone,
            defaultAddress: shippingAddress,
          },
        });
        await refreshProfile();
      } catch {}

      clearCart.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: t.checkout.successPayment, description: t.checkout.successPaymentDesc(order.orderNumber) });
          setLocation(`/orders`);
        }
      });
    } catch {
      toast({ title: t.checkout.errorPayment, description: t.checkout.errorPaymentSub, variant: "destructive" });
    }
  };

  const handlePaymentError = (msg: string) => {
    toast({ title: t.checkout.errorCharge, description: msg, variant: "destructive" });
  };

  if (isCartLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20 container mx-auto px-4 md:px-6">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (step === 1 && !frozenCart && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center bg-muted/10">
          <div className="text-center max-w-md mx-auto p-10 bg-card rounded-2xl border shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4">{t.checkout.emptyCart}</h2>
            <p className="text-muted-foreground mb-8">{t.checkout.emptyCartSub}</p>
            <Button size="lg" className="rounded-full w-full" onClick={() => setLocation("/products")}>
              {t.checkout.goToStore}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!activeCart) return null;

  const total = activeCart.subtotal + shippingCost;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 pt-32 pb-32">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-serif font-bold text-foreground">{t.checkout.title}</h1>
            <p className="text-muted-foreground mt-2">{t.checkout.subtitle}</p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              {[1, 2].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all", step > s ? "bg-emerald-500 text-white" : step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {i < 1 && <div className={cn("h-1 w-10 rounded-full transition-all", step > s ? "bg-emerald-500" : "bg-muted")} />}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-12 mb-8 text-sm font-medium text-muted-foreground">
            <span className={step >= 1 ? "text-primary font-bold" : ""}>{t.checkout.stepShipping}</span>
            <span className={step >= 2 ? "text-primary font-bold" : ""}>{t.checkout.stepPayment}</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 space-y-8">

              <div className={cn("bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-500", step !== 1 ? "opacity-60 ring-1 ring-border" : "ring-2 ring-primary shadow-md")}>
                <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b">
                  <h2 className="text-xl font-serif font-bold flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", step > 1 ? "bg-emerald-500 text-white" : step === 1 ? "bg-primary text-primary-foreground" : "bg-background text-foreground border")}>
                      {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                    </div>
                    {t.checkout.shippingInfo}
                  </h2>
                  {step > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-primary hover:text-primary hover:bg-primary/10">
                      {t.checkout.edit}
                    </Button>
                  )}
                </div>
                <div className={cn("p-6", step !== 1 && "hidden md:block md:pointer-events-none")}>
                  {/* Signed-in / Sign-in prompt banner */}
                  {userEmail ? (
                    <div className="flex items-center gap-3 bg-primary/8 border border-primary/25 rounded-xl px-4 py-3 mb-5">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() ?? userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{t.auth?.signedInAs ?? "Signed in as"} {user?.name ?? userEmail}</p>
                        {user?.defaultAddress && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.auth?.addressPreFilled ?? "Your saved address has been pre-filled"}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-muted/50 border rounded-xl px-4 py-3 mb-5 gap-3">
                      <p className="text-sm text-muted-foreground">{t.auth?.checkoutSignInPrompt ?? "Have an account? Sign in to pre-fill your address."}</p>
                      <button
                        type="button"
                        className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
                        onClick={() => openSignIn()}
                      >
                        {t.auth?.signIn ?? "Sign In"} →
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleAddressSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">{t.checkout.email}</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          readOnly={!!userEmail}
                          className={cn(
                            "h-12 bg-background",
                            userEmail && "bg-muted/40 cursor-not-allowed",
                          )}
                          spellCheck={false}
                          data-gramm="false"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">{t.checkout.phone}</Label>
                        <Input id="phone" type="tel" required autoComplete="tel" value={shippingAddress.phone} onChange={e => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))} className="h-12 bg-background" spellCheck={false} data-gramm="false" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">{t.checkout.fullName}</Label>
                      <Input id="fullName" required autoComplete="name" value={shippingAddress.fullName} onChange={e => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))} className="h-12 bg-background" spellCheck={false} data-gramm="false" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="line1" className="text-sm font-medium">{t.checkout.address}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground z-10" />
                        <AddressAutocomplete
                          id="line1"
                          required
                          value={shippingAddress.line1}
                          onChange={(line1) => setShippingAddress(prev => ({ ...prev, line1 }))}
                          onAddressSelected={(parsed: ParsedAddress) => {
                            setShippingAddress(prev => ({
                              ...prev,
                              line1: parsed.line1 || prev.line1,
                              city: parsed.city || prev.city,
                              state: parsed.state || prev.state,
                              zipCode: parsed.zipCode || prev.zipCode,
                            }));
                          }}
                          placeholder={t.checkout.addressPlaceholder}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="line2" className="text-sm font-medium text-muted-foreground">{t.checkout.apt}</Label>
                      <Input id="line2" autoComplete="address-line2" value={shippingAddress.line2} onChange={e => setShippingAddress(prev => ({ ...prev, line2: e.target.value }))} className="h-12 bg-background" spellCheck={false} data-gramm="false" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-5">
                      <div className="space-y-2 col-span-2 sm:col-span-3">
                        <Label htmlFor="city" className="text-sm font-medium">{t.checkout.city}</Label>
                        <Input id="city" required autoComplete="address-level2" value={shippingAddress.city} onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} className="h-12 bg-background" spellCheck={false} data-gramm="false" />
                      </div>
                      <div className="space-y-2 col-span-1 sm:col-span-1">
                        <Label htmlFor="state" className="text-sm font-medium">{t.checkout.state}</Label>
                        <Input id="state" required autoComplete="address-level1" value={shippingAddress.state} onChange={e => setShippingAddress(prev => ({ ...prev, state: e.target.value }))} className="h-12 bg-background" placeholder="CA" spellCheck={false} data-gramm="false" />
                      </div>
                      <div className="space-y-2 col-span-1 sm:col-span-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium">{t.checkout.zip}</Label>
                        <Input id="zipCode" required autoComplete="postal-code" inputMode="numeric" value={shippingAddress.zipCode} onChange={e => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))} className="h-12 bg-background" spellCheck={false} data-gramm="false" />
                      </div>
                    </div>
                    {step === 1 && (
                      <div className="pt-4">
                        <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-full" disabled={isPreparingPayment}>
                          {isPreparingPayment ? t.checkout.preparingPayment : <><CreditCard className="w-5 h-5 mr-2" /> {t.checkout.continuePayment}</>}
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className={cn("bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-500", step !== 2 ? "opacity-60 ring-1 ring-border" : "ring-2 ring-primary shadow-md")}>
                <div className="bg-muted/30 px-6 py-4 border-b">
                  <h2 className="text-xl font-serif font-bold flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", step === 2 ? "bg-primary text-primary-foreground" : "bg-background text-foreground border")}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    {t.checkout.securePayment}
                  </h2>
                </div>
                <div className="p-6">
                  {step === 2 && clientSecret && stripePromiseState ? (
                    <Elements
                      stripe={stripePromiseState}
                      options={{
                        clientSecret,
                        appearance: { theme: "stripe", variables: { colorPrimary: "#002B7F", fontFamily: "Inter, sans-serif", borderRadius: "12px" } },
                      }}
                    >
                      <PaymentForm
                        billingDefaults={{
                          name: shippingAddress.fullName,
                          email: customerEmail,
                          phone: shippingAddress.phone,
                          address: {
                            line1: shippingAddress.line1,
                            line2: shippingAddress.line2 || undefined,
                            city: shippingAddress.city,
                            state: shippingAddress.state,
                            postal_code: shippingAddress.zipCode,
                            country: "US",
                          },
                        }}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        submitting={paymentSubmitting}
                        setSubmitting={setPaymentSubmitting}
                        returnUrl={window.location.origin + import.meta.env.BASE_URL + "orders"}
                      />
                    </Elements>
                  ) : step < 2 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>{t.checkout.fillShippingFirst}</p>
                    </div>
                  ) : paymentError ? (
                    <div className="py-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-red-600" />
                      </div>
                      <p className="text-sm text-red-700 font-medium mb-4 max-w-md mx-auto">{paymentError}</p>
                      <Button onClick={() => { setStep(1); setPaymentError(null); }} variant="outline" className="rounded-full">
                        {t.checkout.edit}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {t.checkout.preparingForm}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="lg:col-span-5">
              <div className="bg-primary/5 rounded-2xl border border-primary/10 shadow-sm p-6 lg:p-8 sticky top-28">
                <h2 className="text-2xl font-serif font-bold mb-6 pb-4 border-b border-primary/10">{t.checkout.orderSummary}</h2>
                <div className="space-y-5 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                  {activeCart.items.map(item => (
                    <div key={item.id} className="flex gap-4 bg-background p-3 rounded-xl border shadow-sm">
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative border">
                        <img loading="lazy" src={item.productImageUrl || ""} alt={item.productName} className="w-full h-full object-cover" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-secondary-foreground rounded-full text-xs flex items-center justify-center font-bold shadow-sm border-2 border-background">{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="font-bold text-sm leading-tight line-clamp-2 pr-4">{item.productName}</div>
                        <div className="flex justify-between items-end mt-2">
                          <div className="text-muted-foreground text-sm">${item.price.toFixed(2)} c/u</div>
                          <div className="font-bold text-primary">${item.subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-background rounded-xl p-5 border shadow-sm space-y-4 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.checkout.subtotal}</span>
                    <span className="font-bold">${activeCart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.checkout.shippingCost}</span>
                    <span className={cn("font-medium text-right", isFreeShipping && "text-emerald-600")}>
                      {isFreeShipping ? (t as any).freeShipping?.free ?? "FREE" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="font-serif font-bold text-xl">{t.checkout.total}</span>
                    <span className="font-bold text-3xl text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
