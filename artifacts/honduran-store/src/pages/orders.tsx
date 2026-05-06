import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, LogIn } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useUser, openSignIn } from "@/hooks/use-user";
import { getGuestId } from "@/lib/guestId";

export default function Orders() {
  const { email: userEmail, loading: userLoading } = useUser();
  // Both signed-in users (matched by Clerk email) and guests (matched by
  // x-guest-token header injected via setGuestTokenGetter) can list orders.
  // We pass guestToken as an explicit query param too so React Query keys
  // bucket by device — preventing one device's cache from leaking onto
  // another after sign-out.
  const guestId = !userEmail ? getGuestId() : undefined;
  const listParams = guestId ? { guestToken: guestId } : undefined;
  const { data: orders, isLoading } = useListOrders(listParams, {
    query: { enabled: !userLoading, queryKey: getListOrdersQueryKey(listParams) },
  });
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : es;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "shipped": return <Truck className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered": return t.orders.statusDelivered;
      case "shipped": return t.orders.statusShipped;
      case "processing": return t.orders.statusProcessing;
      default: return t.orders.statusPending;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-50 border-green-200 text-green-800";
      case "shipped": return "bg-blue-50 border-blue-200 text-blue-800";
      case "processing": return "bg-amber-50 border-amber-200 text-amber-800";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{t.orders.title}</h1>
              <p className="text-muted-foreground text-lg">{t.orders.subtitle}</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="rounded-full shadow-sm">{t.orders.keepShopping}</Button>
            </Link>
          </div>

          {!userEmail && !userLoading && orders && orders.length > 0 && (
            <div className="bg-secondary/40 border border-secondary rounded-xl p-4 mb-6 flex items-center gap-3">
              <LogIn className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold">{(t.auth as any)?.guestOrdersBannerTitle ?? "Showing orders from this device"}</span>
                <span className="text-muted-foreground"> — {(t.auth as any)?.guestOrdersBannerSub ?? "sign in to keep them in your account."}</span>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => openSignIn()}>
                {t.auth?.signIn ?? "Sign in"}
              </Button>
            </div>
          )}

          {isLoading || userLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-sm border p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-12">
              <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Package className="w-12 h-12 text-muted-foreground/60" />
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4">{t.orders.empty}</h2>
              <p className="text-muted-foreground mb-8 text-lg">{t.orders.emptySub}</p>
              <Link href="/products">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg">{t.orders.discover}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, idx) => (
                <div key={order.id} className="block">
                  <div className={cn("bg-card rounded-2xl border shadow-sm p-6 sm:p-8 transition-all duration-300 group", idx === 0 ? "border-primary/20 ring-1 ring-primary/5" : "")}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-serif font-bold text-xl">{t.orders.order} #{order.orderNumber}</h3>
                            {idx === 0 && <span className="bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">{t.orders.newest}</span>}
                          </div>
                          <div className="text-muted-foreground">
                            {t.orders.placedOn} {format(new Date(order.createdAt), lang === "en" ? "MMMM d, yyyy" : "d 'de' MMMM, yyyy", { locale: dateLocale })}
                          </div>
                        </div>
                      </div>
                      <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border md:self-center w-fit", getStatusBg(order.status))}>
                        {getStatusIcon(order.status)}
                        <span className="font-bold text-sm">{getStatusLabel(order.status)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-6 gap-6">
                      <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                        <div className="flex -space-x-3">
                          {order.items.slice(0, 4).map((item, i) => (
                            <div key={i} className="w-14 h-14 rounded-full bg-background border-2 border-background overflow-hidden flex-shrink-0 shadow-sm relative z-10" style={{ zIndex: 10 - i }}>
                              <img loading="lazy" src={item.productImageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"} alt={item.productName} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        {order.items.length > 4 && (
                          <div className="text-sm font-medium text-muted-foreground ml-2">{t.orders.more(order.items.length - 4)}</div>
                        )}
                        <div className="text-sm text-muted-foreground ml-2 hidden sm:block">{t.orders.items(order.items.length)}</div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">{t.orders.totalPaid}</div>
                          <div className="font-bold text-2xl text-foreground">${order.total.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
