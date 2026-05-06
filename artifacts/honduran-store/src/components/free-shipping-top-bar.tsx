import { Truck, CheckCircle2 } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";

import { useLanguage } from "@/hooks/use-language";
import { useShippingConfig } from "@/hooks/use-shipping-config";
import { cn } from "@/lib/utils";

interface Props {
  hidden?: boolean;
}

/**
 * Slim site-wide shipping nudge. Renders fixed at the very top of the
 * viewport (above the Header). Updates live as the cart changes.
 */
export function FreeShippingTopBar({ hidden }: Props) {
  const { t } = useLanguage();
  const { freeShippingThreshold } = useShippingConfig();
  const { data: cart } = useGetCart();

  const subtotal = Math.max(cart?.subtotal ?? 0, 0);
  const remaining = Math.max(freeShippingThreshold - subtotal, 0);
  const unlocked = remaining <= 0;
  const tt = t as any;

  let message: string;
  if (unlocked) {
    message = tt.freeShipping?.unlocked ?? "You unlocked free shipping!";
  } else if (subtotal === 0) {
    const start = tt.freeShipping?.start;
    message = typeof start === "function"
      ? start(freeShippingThreshold.toFixed(2))
      : `Free shipping on orders over $${freeShippingThreshold.toFixed(2)}`;
  } else {
    const away = tt.freeShipping?.away;
    message = typeof away === "function"
      ? away(remaining.toFixed(2))
      : `$${remaining.toFixed(2)} away from free shipping`;
  }

  return (
    <div
      role="status"
      aria-label={message}
      data-testid="free-shipping-top-bar"
      className={cn(
        "fixed top-0 inset-x-0 z-[60] h-9 transition-all duration-300 ease-in-out border-b overflow-hidden",
        hidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
        unlocked
          ? "bg-secondary text-secondary-foreground border-secondary/60"
          : "bg-primary text-primary-foreground border-primary/40",
      )}
    >
      <div className="container mx-auto h-full px-4 md:px-6 flex items-center justify-center gap-2 sm:gap-3">
        {unlocked ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <Truck className="w-4 h-4 shrink-0" />
        )}
        <p className="text-xs sm:text-sm font-semibold leading-none truncate">{message}</p>
      </div>
    </div>
  );
}
