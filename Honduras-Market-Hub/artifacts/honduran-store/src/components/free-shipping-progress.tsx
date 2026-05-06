import { Truck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useShippingConfig } from "@/hooks/use-shipping-config";
import { cn } from "@/lib/utils";

interface Props {
  subtotal: number;
  className?: string;
}

export function FreeShippingProgress({ subtotal, className }: Props) {
  const { t } = useLanguage();
  const { freeShippingThreshold } = useShippingConfig();

  const tt = t as any;
  const safeSubtotal = Math.max(subtotal, 0);
  const progress = freeShippingThreshold > 0 ? Math.min(safeSubtotal / freeShippingThreshold, 1) : 1;
  const remaining = Math.max(freeShippingThreshold - safeSubtotal, 0);
  const unlocked = remaining <= 0;

  const fmt = remaining.toFixed(2);
  let message: string;
  if (unlocked) {
    message = tt.freeShipping?.unlocked ?? "You unlocked free shipping!";
  } else if (safeSubtotal === 0) {
    const start = tt.freeShipping?.start;
    message = typeof start === "function"
      ? start(freeShippingThreshold.toFixed(2))
      : `Free shipping on orders over $${freeShippingThreshold.toFixed(2)}`;
  } else {
    const away = tt.freeShipping?.away;
    message = typeof away === "function" ? away(fmt) : `$${fmt} away from free shipping`;
  }

  return (
    <div
      role="status"
      aria-label={message}
      className={cn(
        "rounded-2xl border p-4 sm:p-5 transition-colors",
        unlocked
          ? "bg-secondary/15 border-secondary/40"
          : "bg-primary/5 border-primary/15",
        className,
      )}
      data-testid="free-shipping-progress"
    >
      <div className="flex items-center gap-3 mb-3">
        {unlocked ? (
          <CheckCircle2 className="w-5 h-5 text-secondary-foreground shrink-0" />
        ) : (
          <Truck className="w-5 h-5 text-primary shrink-0" />
        )}
        <p
          className={cn(
            "text-sm sm:text-[15px] font-semibold leading-tight",
            unlocked ? "text-secondary-foreground" : "text-foreground",
          )}
        >
          {message}
        </p>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            unlocked ? "bg-secondary" : "bg-primary",
          )}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
