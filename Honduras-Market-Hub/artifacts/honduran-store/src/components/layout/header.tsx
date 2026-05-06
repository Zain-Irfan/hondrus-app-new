import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, Search, X, LogOut, ChevronDown, Package } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FreeShippingTopBar } from "@/components/free-shipping-top-bar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useUser, registerOpenSignIn, unregisterOpenSignIn } from "@/hooks/use-user";

export function Header() {
  const { data: cart } = useGetCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { lang, setLang, t } = useLanguage();
  const { email, user, logout } = useUser();

  const isHome = location === "/";
  const transparent = isHome && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Register the sign-in opener so any page can call openSignIn() — it now
  // navigates to the dedicated /sign-in page powered by Clerk.
  useEffect(() => {
    registerOpenSignIn(() => setLocation("/sign-in"));
    return () => unregisterOpenSignIn();
  }, [setLocation]);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "U";

  function LangToggle({ className }: { className?: string }) {
    return (
      <button
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        className={cn(
          "flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full border transition-all",
          transparent
            ? "border-white/30 text-white hover:bg-white/10"
            : "border-border text-foreground hover:bg-muted",
          className
        )}
        aria-label="Change language"
      >
        <span className={cn("transition-opacity", lang === "es" ? "opacity-100" : "opacity-40")}>ES</span>
        <span className={cn(transparent ? "text-white/40" : "text-muted-foreground")}>|</span>
        <span className={cn("transition-opacity", lang === "en" ? "opacity-100" : "opacity-40")}>EN</span>
      </button>
    );
  }

  function UserMenu() {
    if (!email) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-full font-semibold px-3 cursor-pointer",
            transparent ? "text-white hover:bg-white/10" : "hover:bg-muted/50"
          )}
          onClick={() => setLocation("/sign-in")}
        >
          <User className="w-4 h-4" />
          <span className="hidden md:inline">{t.auth?.signIn ?? "Sign In"}</span>
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "hidden sm:flex items-center gap-2 rounded-full px-2 cursor-pointer",
              transparent ? "text-white hover:bg-white/10" : "hover:bg-muted/50"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <span className={cn("hidden md:inline text-sm font-semibold max-w-[100px] truncate", transparent ? "text-white" : "")}>
              {user?.name ?? email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 hidden md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-sm font-bold truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              {t.account?.myProfile ?? "My Profile"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
              <Package className="w-4 h-4" />
              {t.account?.myOrders ?? "My Orders"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            {t.account?.logout ?? "Sign Out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Hide the slim shipping bar over the transparent hero (home, before scroll).
  // It would clash with the full-bleed image; once the user scrolls or visits
  // any other page the bar appears.
  const showTopBar = !transparent;

  return (
    <>
      <FreeShippingTopBar hidden={!showTopBar} />
      <header
        className={cn(
          "fixed w-full z-50 transition-all duration-300 ease-in-out border-b",
          showTopBar ? "top-9" : "top-0",
          transparent
            ? "bg-transparent border-transparent py-6"
            : "bg-background/95 backdrop-blur-md border-border shadow-sm py-3"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn("md:hidden", transparent ? "text-white hover:bg-white/10" : "hover:bg-muted/50")}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className={cn("w-6 h-6", transparent ? "text-white" : "text-foreground")} />
            </Button>
            <Link href="/" className="flex items-center gap-2 group">
              <span
                className={cn(
                  "font-serif text-2xl font-bold tracking-tight transition-colors",
                  transparent ? "text-white group-hover:text-white/80" : "text-primary group-hover:text-primary/80"
                )}
              >
                Sabores de Honduras
              </span>
            </Link>
          </div>

          <nav
            className={cn(
              "hidden md:flex items-center gap-8 text-sm font-semibold",
              transparent ? "text-white/90" : "text-foreground"
            )}
          >
            <Link href="/products" className="hover:text-secondary transition-colors py-2">
              {t.nav.store}
            </Link>
            <Link href="/brands" className="hover:text-secondary transition-colors py-2">
              {t.nav.brands}
            </Link>
            <Link href="/about" className="hover:text-secondary transition-colors py-2">
              {t.nav.story}
            </Link>
            <Link href="/faq" className="hover:text-secondary transition-colors py-2">
              {t.nav.help}
            </Link>
          </nav>

          <div className={cn("flex items-center gap-1 md:gap-2", transparent ? "text-white" : "text-foreground")}>
            <LangToggle className="hidden md:flex" />
            <Link href="/orders">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "cursor-pointer hover:text-secondary",
                  transparent ? "text-white hover:bg-white/10" : ""
                )}
                title={t.account?.myOrders ?? "My Orders"}
                aria-label={t.account?.myOrders ?? "My Orders"}
              >
                <Package className="w-5 h-5" />
              </Button>
            </Link>
            <UserMenu />
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative cursor-pointer hover:text-secondary">
                <ShoppingCart className="w-6 h-6" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center shadow-sm border-2 border-background">
                    {cart.itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col h-full bg-background w-4/5 max-w-sm border-r shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <span className="font-serif text-xl font-bold text-primary">{t.nav.menu}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full bg-muted/50 hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-6">
              <nav className="flex flex-col gap-6 text-lg font-serif">
                <Link href="/products" className="font-bold text-2xl hover:text-primary transition-colors">
                  {t.nav.store}
                </Link>
                <Link href="/brands" className="font-bold text-2xl hover:text-primary transition-colors">
                  {t.nav.brands}
                </Link>
                <Link href="/about" className="font-bold text-2xl hover:text-primary transition-colors">
                  {t.nav.story}
                </Link>
                <Link href="/faq" className="font-bold text-2xl hover:text-primary transition-colors">
                  {t.nav.help}
                </Link>
              </nav>
            </div>

            <div className="p-6 border-t border-border/50 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Language / Idioma</span>
                <LangToggle />
              </div>
              {email ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{user?.name ?? email}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{email}</p>
                    </div>
                  </div>
                  <Link href="/account" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors pl-1">
                    <User className="w-4 h-4" /> {t.account?.myProfile ?? "My Profile"}
                  </Link>
                  <Link href="/orders" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors pl-1">
                    <Package className="w-4 h-4" /> {t.account?.myOrders ?? "My Orders"}
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 pl-1">
                    <LogOut className="w-4 h-4" /> {t.account?.logout ?? "Sign Out"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); setLocation("/sign-in"); }}
                    className="w-full rounded-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t.auth?.signIn ?? "Sign In"}
                  </Button>
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 py-2">
                    <Package className="w-4 h-4" /> {t.account?.myOrders ?? "My Orders"}
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 left-4/5" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
