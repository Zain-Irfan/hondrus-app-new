import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/hooks/use-language";

export default function Products() {
  const { t } = useLanguage();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialCategory = searchParams.get("category") || undefined;
  const initialSearch = searchParams.get("search") || undefined;

  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [search, setSearch] = useState<string | undefined>(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch || "");
  
  const chipsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  const { data: products, isLoading: isLoadingProducts } = useListProducts({ category, search });
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput || undefined);
  };

  const clearFilters = () => {
    setCategory(undefined);
    setSearch(undefined);
    setSearchInput("");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!chipsScrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = chipsScrollRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const ref = chipsScrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const scrollChips = (direction: 'left' | 'right') => {
    if (!chipsScrollRef.current) return;
    const amount = 200;
    chipsScrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-24">
        {/* Editorial Banner */}
        <div className="relative bg-primary pt-36 pb-20 md:pt-40 md:pb-28 overflow-hidden mb-12">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop')] opacity-10 mix-blend-overlay object-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
          </div>
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
            <span className="text-secondary font-bold tracking-widest uppercase text-sm mb-4 block">{t.products.eyebrow}</span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary-foreground mb-6 inline-block relative">
              {t.products.title}
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-secondary rounded-full opacity-80" />
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto font-serif italic mt-4">
              {t.products.subtitle}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            {/* Mobile Category Chips */}
            <div className="w-full md:hidden order-2 relative mb-2">
              {showLeftScroll && (
                <button 
                  onClick={() => scrollChips('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-r from-background to-transparent flex items-center justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-card shadow-md border flex items-center justify-center text-primary">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </button>
              )}
              
              <div 
                ref={chipsScrollRef}
                className="flex overflow-x-auto gap-3 pb-4 pt-1 snap-x hide-scrollbar relative px-1"
              >
                <button
                  className={cn(
                    "shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm snap-start whitespace-nowrap border",
                    !category 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card text-foreground hover:bg-muted border-border"
                  )}
                  onClick={() => setCategory(undefined)}
                >
                  {t.products.allCategories}
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    className={cn(
                      "shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border snap-start whitespace-nowrap flex items-center gap-2",
                      category === cat.slug 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card text-foreground hover:bg-muted border-border"
                    )}
                    onClick={() => setCategory(cat.slug)}
                  >
                    {cat.name}
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      category === cat.slug ? "bg-primary-foreground/20 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {cat.productCount}
                    </span>
                  </button>
                ))}
              </div>

              {showRightScroll && (
                <button 
                  onClick={() => scrollChips('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-l from-background to-transparent flex items-center justify-end"
                >
                  <div className="w-8 h-8 rounded-full bg-card shadow-md border flex items-center justify-center text-primary">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              )}
            </div>

            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-3 order-1 md:order-2 md:ml-auto">
              <div className="relative flex-1 md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t.products.searchPlaceholder}
                  className="pl-12 pr-4 h-14 bg-card border-border/50 rounded-full shadow-sm text-base focus-visible:ring-primary"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full h-14 px-8 font-bold shadow-md bg-primary hover:bg-primary/90">{t.products.searchBtn}</Button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-12">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden md:block w-72 flex-shrink-0">
              <div className="sticky top-32">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h2 className="font-serif font-bold text-2xl flex items-center gap-3 text-foreground">
                    <SlidersHorizontal className="w-6 h-6 text-secondary" /> {t.products.categories}
                  </h2>
                  {(category || search) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-semibold text-muted-foreground hover:text-destructive flex items-center transition-colors"
                    >
                      {t.products.clearFilters} <X className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>

                {isLoadingCategories ? (
                  <div className="space-y-4">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      className={cn(
                        "text-left px-5 py-4 rounded-xl transition-all text-base font-bold",
                        !category 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted text-foreground bg-transparent"
                      )}
                      onClick={() => setCategory(undefined)}
                    >
                      {t.products.allCategories}
                    </button>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        className={cn(
                          "text-left px-5 py-4 rounded-xl transition-all text-base font-bold flex justify-between items-center group",
                          category === cat.slug 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "hover:bg-muted text-foreground bg-transparent"
                        )}
                        onClick={() => setCategory(cat.slug)}
                      >
                        <span>{cat.name}</span>
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full transition-colors font-bold",
                          category === cat.slug 
                            ? "bg-secondary text-secondary-foreground" 
                            : "bg-muted-foreground/10 text-muted-foreground group-hover:bg-background"
                        )}>
                          {cat.productCount}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {/* Active Filters Display */}
              {(category || search) && (
                <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-card rounded-xl border border-border shadow-sm">
                  <span className="text-sm font-bold text-muted-foreground mr-2 uppercase tracking-wider">{t.products.activeFilters}</span>
                  {category && (
                    <Badge variant="secondary" className="px-4 py-2 flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0">
                      {categories?.find(c => c.slug === category)?.name || category}
                      <button onClick={() => setCategory(undefined)} className="ml-1 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </Badge>
                  )}
                  {search && (
                    <Badge variant="secondary" className="px-4 py-2 flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0">
                      "{search}"
                      <button onClick={() => { setSearch(undefined); setSearchInput(""); }} className="ml-1 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {Array(9).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 bg-card rounded-2xl p-4 border border-border">
                      <Skeleton className="aspect-[3/4] rounded-xl" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-8 w-1/4" />
                      </div>
                      <div className="mt-auto pt-4 border-t border-border">
                        <Skeleton className="h-12 w-full rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products?.length === 0 ? (
                <div className="text-center py-32 bg-card rounded-3xl border shadow-sm flex flex-col items-center">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
                    <Search className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-serif font-bold mb-4 text-foreground">{t.products.noResults}</h3>
                  <p className="text-xl text-muted-foreground mb-10 max-w-md">
                    {t.products.noResultsSub}
                  </p>
                  <Button onClick={clearFilters} size="lg" className="rounded-full h-14 px-10 text-lg font-bold shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    {t.products.viewAll}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {products?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
