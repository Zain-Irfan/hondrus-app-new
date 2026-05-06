import { Link } from "wouter";
import { Truck, Facebook, Instagram, Twitter, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Strip */}
      <div className="border-b border-white/10 bg-primary/95">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 max-w-xl text-center md:text-left">
              <h3 className="font-serif text-2xl font-bold text-secondary mb-2">{t.footer.newsletter}</h3>
              <p className="text-primary-foreground/80">{t.footer.newsletterSub}</p>
            </div>
            <form className="flex w-full md:w-auto max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={t.footer.newsletterPlaceholder}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-full focus-visible:ring-secondary flex-1"
                required
              />
              <Button type="submit" className="h-12 rounded-full px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Send className="w-4 h-4 mr-2" /> {t.footer.newsletter}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-block mb-6 group">
              <span className="font-serif text-3xl font-bold tracking-tight group-hover:text-secondary transition-colors">
                Sabores de Honduras
              </span>
            </Link>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-sm font-medium">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter / X" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-secondary">{t.footer.store}</h3>
              <ul className="space-y-4 text-primary-foreground/80">
                <li><Link href="/products" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.allProducts}</Link></li>
                <li><Link href="/products?category=coffee" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.coffee}</Link></li>
                <li><Link href="/products?category=snacks" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.snacks}</Link></li>
                <li><Link href="/products?category=pantry" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.pantry}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-secondary">{t.footer.support}</h3>
              <ul className="space-y-4 text-primary-foreground/80">
                <li><Link href="/faq" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.faq}</Link></li>
                <li><Link href="/shipping" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.shipping}</Link></li>
                <li><Link href="/contact" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.contact}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-secondary">{t.footer.family}</h3>
              <ul className="space-y-4 text-primary-foreground/80">
                <li><Link href="/brands" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.brands}</Link></li>
                <li><Link href="/about" className="hover:text-white hover:translate-x-1 inline-block transition-transform">{t.footer.story}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-sm text-primary-foreground/60 font-medium">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-3 text-xs text-primary-foreground/60">
              <span className="px-2 py-1 bg-white/10 rounded">Visa</span>
              <span className="px-2 py-1 bg-white/10 rounded">Mastercard</span>
              <span className="px-2 py-1 bg-white/10 rounded">Amex</span>
              <span className="px-2 py-1 bg-white/10 rounded">PayPal</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80 font-medium">
              <Truck className="w-4 h-4 text-secondary" />
              <span>{t.footer.shippingBadge}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
