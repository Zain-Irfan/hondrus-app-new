import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Product } from "@workspace/api-client-react";
import { useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Star, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

export function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: t.productCard.added,
          description: `${product.name} ${t.productCard.addedDesc}`,
        });
      },
    },
  });

  return (
    <div className="group relative flex flex-col rounded-2xl bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 border border-transparent hover:border-border/50">
      <Link href={`/products/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-muted/30">
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />

        {product.isBestseller && (
          <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-md">
            {t.productCard.bestseller}
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-foreground text-background text-sm font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">
              {t.productCard.outOfStock}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{product.origin}</div>
          <div className="flex items-center gap-0.5 text-secondary">
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        <Link href={`/products/${product.id}`} className="font-serif font-bold text-xl hover:text-primary transition-colors flex-1 line-clamp-2 leading-snug mb-3">
          {product.name}
        </Link>

        <div className="mt-auto flex flex-col gap-4">
          <div className="font-bold text-2xl text-secondary leading-none">
            ${product.price.toFixed(2)}
          </div>

          <Button
            className={cn(
              "w-full rounded-full font-semibold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
            }}
            disabled={!product.inStock || addToCart.isPending}
          >
            {addToCart.isPending ? (
              "..."
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t.productCard.addToCart}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
