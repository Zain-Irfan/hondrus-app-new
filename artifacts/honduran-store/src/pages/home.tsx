import { Link, useLocation } from "wouter";
import { useGetFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, Heart, Coffee, Send, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/hooks/use-language";

export default function Home() {
  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedProducts();
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section — v2 redesign: half-height, real product image, single gradient,
            single primary CTA so users don't hesitate. Products visible above the fold. */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground min-h-[60vh] md:min-h-[68vh] flex flex-col justify-center pt-24 pb-16">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=2000&auto=format&fit=crop"
              alt="Café de Marcala — Sabores de Honduras"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
          </div>

          <div className="container relative z-10 mx-auto px-4 flex-1 flex items-center mt-8 md:mt-0">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-secondary text-secondary-foreground text-xs font-bold tracking-[2px] uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow">
                <Truck className="w-3.5 h-3.5" /> {t.home.badge}
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-semibold mb-5 leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance tracking-tight">
                {t.home.heroTitle1} <span className="text-secondary italic">{t.home.heroAccent}</span> {t.home.heroTitle2} {t.home.heroTitle3}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/95 mb-8 max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {t.home.heroSub}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base h-12 px-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all font-bold"
                  onClick={() => setLocation("/products")}
                >
                  {t.home.shopNow} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <button
                  className="text-sm font-semibold text-white/90 hover:text-secondary border-b-2 border-transparent hover:border-secondary pb-1 transition-colors"
                  onClick={() => setLocation("/brands")}
                >
                  Conocé a los productores →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-16 bg-card border-b border-border shadow-sm relative z-20 -mt-6 mx-4 md:mx-10 rounded-2xl md:rounded-full">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8">
              <div className="flex flex-col items-center text-center gap-4 p-2">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1 text-foreground">{t.home.trustShipping}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t.home.trustShippingSub}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-2">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shadow-sm border border-secondary/20">
                  <Coffee className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1 text-foreground">{t.home.trustAuthentic}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t.home.trustAuthenticSub}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-2">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1 text-foreground">{t.home.trustQuality}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t.home.trustQualitySub}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-2">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shadow-sm border border-secondary/20">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1 text-foreground">{t.home.trustLove}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t.home.trustLoveSub}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">{t.home.aislesTitle}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.home.aislesSub}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {isLoadingCategories ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] md:aspect-square rounded-2xl" />
                ))
              ) : (
                categories?.slice(0, 4).map(category => (
                  <Link key={category.id} href={`/products?category=${category.slug}`} className="group relative aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden bg-muted block shadow-sm hover:shadow-xl transition-all duration-500">
                    <img
                      src={category.imageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                      <h3 className="text-white font-serif font-bold text-2xl md:text-3xl mb-2">{category.name}</h3>
                      <p className="text-secondary text-sm font-bold tracking-wider uppercase flex items-center gap-2 group-hover:translate-x-2 transition-transform duration-300">
                        {t.home.viewProducts} <ArrowRight className="w-4 h-4" />
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Bestsellers */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">{t.home.bestsellersTitle}</h2>
                <p className="text-lg text-muted-foreground">{t.home.bestsellersSub}</p>
              </div>
              <Button 
                variant="outline" 
                className="hidden md:flex rounded-full px-8 h-12 text-base font-semibold border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => setLocation("/products?bestseller=true")}
              >
                {t.home.viewAll} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {isLoadingFeatured ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <Skeleton className="aspect-[3/4] rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                ))
              ) : (
                featured?.bestsellers?.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>

            <div className="mt-12 text-center md:hidden">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full rounded-full h-14 text-lg border-primary/20"
                onClick={() => setLocation("/products?bestseller=true")}
              >
                {t.home.bestsellersTitle}
              </Button>
            </div>
          </div>
        </section>

        {/* Cultural Storytelling */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 space-y-8">
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight">
                  {t.home.storyTitle1} <br/><span className="text-secondary italic">{t.home.storyTitle2}</span>
                </h2>
                <div className="space-y-6 text-primary-foreground/90 text-xl md:text-2xl leading-relaxed font-serif italic">
                  "{t.home.storyP1}"
                </div>
                <div className="text-primary-foreground/80 text-lg md:text-xl font-medium leading-relaxed">
                  <p>{t.home.storyP2}</p>
                </div>
                <div className="pt-6">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground h-14 px-10 text-lg transition-all"
                    onClick={() => setLocation("/about")}
                  >
                    {t.home.ourStory}
                  </Button>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
                  <img
                    src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=2000&auto=format&fit=crop"
                    alt="Preparando café hondureño"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-white/20 rounded-3xl m-4 pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-32 bg-foreground text-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-8 text-secondary">
              <Heart className="w-10 h-10 fill-current" />
            </div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">{t.home.newsletterTitle}</h2>
            <p className="text-xl md:text-2xl text-muted/80 mb-10">{t.home.newsletterSub}</p>
            <form className="flex flex-col sm:flex-row gap-3 w-full" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={t.home.newsletterPlaceholder}
                className="h-16 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full px-8 text-lg flex-1 focus-visible:ring-secondary"
                required
              />
              <Button type="submit" size="lg" className="h-16 rounded-full px-10 text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg">
                {t.home.newsletterBtn} <Send className="w-5 h-5 ml-3" />
              </Button>
            </form>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
