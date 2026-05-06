import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, PackageOpen, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { useShippingConfig } from "@/hooks/use-shipping-config";
import { FreeShippingProgress } from "@/components/free-shipping-progress";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const shippingConfig = useShippingConfig();

  const updateItem = useUpdateCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
  });

  const removeItem = useRemoveCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
  });

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem.mutate({ itemId, data: { quantity: newQuantity } });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId });
  };

  const subtotal = cart?.subtotal ?? 0;
  const isFreeShipping = subtotal >= shippingConfig.freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : shippingConfig.standardRate;
  const estimatedTotal = subtotal + shippingCost;
  const tt = t as any;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">{t.cart.title}</h1>
            {cart && cart.itemCount > 0 && (
              <p className="text-muted-foreground mt-3 text-lg">{t.cart.items(cart.itemCount)}</p>
            )}
          </div>

          {isLoading ? (
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-8 space-y-5">
                {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
              </div>
              <div className="lg:col-span-4"><Skeleton className="h-96 w-full rounded-2xl" /></div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-sm border p-12 md:p-20 text-center flex flex-col items-center justify-center max-w-3xl mx-auto my-10">
              <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-8 relative border-4 border-background shadow-inner">
                <PackageOpen className="w-12 h-12 text-muted-foreground" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30"></span>
                </div>
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4">{t.cart.empty}</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">{t.cart.emptySub}</p>
              <Link href="/products">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
                  {t.cart.explore}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-8 space-y-5">
                {cart.items.map((item) => (
                  <div key={item.id} className="bg-card rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row gap-5 sm:gap-6 group hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4">
                    <Link href={`/products/${item.productId}`} className="w-full sm:w-36 h-48 sm:h-36 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0 relative block">
                      <img src={item.productImageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"} alt={item.productName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link href={`/products/${item.productId}`} className="font-serif font-bold text-xl hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {item.productName}
                          </Link>
                          <div className="text-primary font-medium mt-1 text-lg">${item.price.toFixed(2)}</div>
                        </div>
                        <button className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:cursor-not-allowed" onClick={() => handleRemove(item.id)} disabled={removeItem.isPending} aria-label={t.cart.remove}>
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-end mt-6 sm:mt-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.cart.qty}</span>
                          <div className="flex items-center border rounded-full h-10 bg-background shadow-sm w-[100px]">
                            <button className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={updateItem.isPending || item.quantity <= 1}>
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 text-center font-medium text-sm">{item.quantity}</div>
                            <button className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={updateItem.isPending}>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">{t.cart.subtotal}</span>
                          <div className="font-bold text-xl text-foreground">${item.subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <div className="bg-primary/5 rounded-3xl border border-primary/10 shadow-sm p-6 sm:p-8 sticky top-28">
                  <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2 text-primary">
                    <ShoppingBag className="w-5 h-5" /> {t.cart.summary}
                  </h2>

                  <FreeShippingProgress subtotal={subtotal} className="mb-5" />

                  <div className="space-y-4 mb-6 text-base bg-background p-5 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t.cart.products(cart.itemCount)}</span>
                      <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t.cart.shipping}</span>
                      {isFreeShipping ? (
                        <span className="font-bold text-secondary-foreground bg-secondary/20 px-2 py-0.5 rounded-md text-sm">
                          {tt.freeShipping?.free ?? "FREE"}
                        </span>
                      ) : (
                        <span className="font-medium">${shippingCost.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="pt-4 mt-2 border-t flex justify-between items-center">
                      <span className="font-bold text-xl">{t.cart.estimatedTotal}</span>
                      <span className="font-bold text-3xl text-primary">${estimatedTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">{t.cart.taxNote}</p>
                  </div>
                  <Button className="w-full h-14 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={() => setLocation("/checkout")}>
                    {t.cart.checkout} <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>{t.cart.secure}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
