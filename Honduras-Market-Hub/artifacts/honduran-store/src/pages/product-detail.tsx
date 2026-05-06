import { useParams } from "wouter";
import { useGetProduct, useAddToCart, getGetCartQueryKey, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Truck, Shield, Clock, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0");
  const { t } = useLanguage();

  const { data: product, isLoading, error } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) }
  });

  const { data: relatedProducts } = useListProducts({ category: product?.categoryName }, {
    query: { enabled: !!product, queryKey: getListProductsQueryKey({ category: product?.categoryName }) }
  });

  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: t.productDetail.toastTitle,
          description: t.productDetail.toastDesc(quantity, product?.name || ""),
        });
      },
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ data: { productId: product.id, quantity } });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1 pt-28 pb-20 container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5 lg:col-span-6"><Skeleton className="aspect-square w-full rounded-2xl" /></div>
            <div className="md:col-span-7 lg:col-span-6 space-y-6">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full mt-8" />
              <Skeleton className="h-16 w-full mt-8 rounded-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
          <div className="text-center max-w-md px-6 py-12 bg-muted/20 rounded-3xl border border-dashed">
            <h2 className="text-3xl font-serif font-bold mb-4">{t.productDetail.notFound}</h2>
            <p className="text-muted-foreground mb-8">{t.productDetail.notFoundSub}</p>
            <Link href="/products">
              <Button size="lg" className="rounded-full">{t.productDetail.backToStore}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <nav className="flex text-sm text-muted-foreground mb-8 py-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-primary transition-colors">{t.productDetail.home}</Link></li>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
              <li><Link href="/products" className="hover:text-primary transition-colors">{t.productDetail.catalog}</Link></li>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
              <li><Link href={`/products?category=${product.categoryName}`} className="hover:text-primary transition-colors font-medium">{product.categoryName}</Link></li>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
              <li className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-[200px]" aria-current="page">{product.name}</li>
            </ol>
          </nav>

          <div className="grid md:grid-cols-12 gap-10 lg:gap-16 mb-24">
            <div className="md:col-span-5 lg:col-span-6 space-y-4">
              <div className="aspect-square rounded-3xl overflow-hidden bg-muted/30 relative border shadow-sm">
                <img src={product.imageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"} alt={product.name} className="w-full h-full object-cover object-center" />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isBestseller && (
                    <div className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-md">
                      {t.productDetail.topSeller}
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="bg-destructive text-destructive-foreground text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-md">
                      {t.productDetail.outOfStock}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-7 lg:col-span-6 flex flex-col pt-2 lg:pt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-primary font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  {product.origin}
                </div>
                <div className="flex items-center gap-1 text-secondary">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs text-muted-foreground font-medium ml-1">(4.9)</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6 leading-[1.1] text-balance">
                {product.name}
              </h1>

              <div className="text-4xl font-bold mb-8 flex items-end gap-3 text-primary">
                ${product.price.toFixed(2)}
                <span className="text-base font-normal text-muted-foreground mb-1">{t.productDetail.unit}</span>
              </div>

              <div className="prose prose-lg text-muted-foreground mb-10 leading-relaxed max-w-none">
                <p>{product.description}</p>
              </div>

              <div className={cn("p-6 rounded-2xl border bg-card shadow-sm mb-10", !product.inStock && "opacity-75")}>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center border-2 border-border/80 rounded-full h-14 w-full sm:w-40 bg-background overflow-hidden flex-shrink-0">
                    <button className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!product.inStock || quantity <= 1}>
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center font-bold text-lg">{quantity}</div>
                    <button className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30" onClick={() => setQuantity(quantity + 1)} disabled={!product.inStock || quantity >= product.stockQuantity}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button size="lg" className={cn("flex-1 h-14 text-lg rounded-full gap-3 shadow-lg transition-all w-full", product.inStock ? "hover:shadow-xl hover:-translate-y-0.5" : "")} onClick={handleAddToCart} disabled={!product.inStock || addToCart.isPending}>
                    {addToCart.isPending ? t.productDetail.adding : product.inStock ? (
                      <><ShoppingCart className="w-5 h-5" /> {t.productDetail.addToCart}</>
                    ) : t.productDetail.soldOut}
                  </Button>
                </div>
                {product.inStock && product.stockQuantity < 10 && (
                  <p className="text-sm text-secondary font-bold mt-4 flex items-center gap-2 justify-center sm:justify-start">
                    <Clock className="w-4 h-4" />
                    {t.productDetail.lowStock(product.stockQuantity)}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 pt-6 border-t">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{t.productDetail.shippingTitle}</h4>
                    <p className="text-sm text-muted-foreground leading-snug">{t.productDetail.shippingSub}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{t.productDetail.qualityTitle}</h4>
                    <p className="text-sm text-muted-foreground leading-snug">{t.productDetail.qualitySub}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedProducts && relatedProducts.length > 1 && (
            <div className="mt-24 pt-16 border-t border-border/60">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">{t.productDetail.relatedTitle}</h2>
                  <p className="text-muted-foreground text-lg">{t.productDetail.relatedSub}</p>
                </div>
                <Link href={`/products?category=${product.categoryName}`} className="hidden sm:flex items-center font-bold text-primary hover:underline">
                  {t.productDetail.viewMore} <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.filter(p => p.id !== product.id).slice(0, 4).map(related => (
                  <ProductCard key={related.id} product={related} />
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href={`/products?category=${product.categoryName}`}>
                  <Button variant="outline" className="w-full rounded-full">{t.productDetail.viewCategory}</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
