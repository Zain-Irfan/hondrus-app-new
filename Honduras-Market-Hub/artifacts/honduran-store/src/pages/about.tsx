import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import {
  Coffee,
  Heart,
  Sprout,
  MapPin,
  Leaf,
  MessagesSquare,
  Truck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function About() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden bg-primary text-primary-foreground pt-32 pb-24 md:pt-40 md:pb-32"
          data-testid="section-about-hero"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1442975631115-c4f7b05b8a2c?q=80&w=2400&auto=format&fit=crop"
              alt="Granos de café hondureño"
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary" />
          </div>
          <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
            <span className="inline-block py-2 px-5 rounded-full bg-secondary/20 text-secondary text-xs md:text-sm font-bold tracking-widest mb-6">
              {t.about.eyebrow}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.05] mb-8 text-balance">
              {t.about.heroTitle1}{" "}
              <span className="text-secondary italic">{t.about.heroTitleAccent}</span>{" "}
              {t.about.heroTitle2}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-3xl mx-auto leading-relaxed">
              {t.about.heroSub}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-10 text-base font-semibold shadow-xl"
                onClick={() => setLocation("/products")}
                data-testid="button-about-shop"
              >
                {t.about.ctaShop}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 hover:bg-white/10 text-white backdrop-blur-sm h-14 px-10 text-base font-semibold"
                onClick={() => setLocation("/contact")}
                data-testid="button-about-contact"
              >
                {t.about.ctaContact}
              </Button>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-24 md:py-32 bg-background" data-testid="section-about-story">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-4 block">
                  {t.about.storyEyebrow}
                </span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-8">
                  {t.about.storyTitle}
                </h2>
                <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
                  <p>{t.about.storyP1}</p>
                  <p>{t.about.storyP2}</p>
                  <p className="text-foreground font-medium italic border-l-4 border-secondary pl-5 py-1">
                    {t.about.storyP3}
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative">
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <img
                      src="https://images.unsplash.com/photo-1559525839-d9acfd03b34a?q=80&w=2000&auto=format&fit=crop"
                      alt="Mercado tradicional hondureño"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-background rotate-6 hidden md:block">
                    <img
                      src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=600&auto=format&fit=crop"
                      alt="Café recién tostado"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission — three pillars */}
        <section className="py-24 md:py-32 bg-muted/30" data-testid="section-about-mission">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-5">
                {t.about.missionTitle}
              </h2>
              <p className="text-lg text-muted-foreground">{t.about.missionSub}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Sprout, title: t.about.mission1Title, desc: t.about.mission1Desc },
                { icon: Coffee, title: t.about.mission2Title, desc: t.about.mission2Desc },
                { icon: Heart, title: t.about.mission3Title, desc: t.about.mission3Desc },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div
                    key={i}
                    className="bg-background rounded-3xl p-8 shadow-sm border border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
                      {m.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values — what makes us different */}
        <section className="py-24 md:py-32 bg-background" data-testid="section-about-values">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground text-center mb-16">
              {t.about.valuesTitle}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: MapPin, title: t.about.value1Title, desc: t.about.value1Desc },
                { icon: Leaf, title: t.about.value2Title, desc: t.about.value2Desc },
                { icon: MessagesSquare, title: t.about.value3Title, desc: t.about.value3Desc },
                { icon: Truck, title: t.about.value4Title, desc: t.about.value4Desc },
              ].map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={i} className="text-center px-2">
                    <div className="w-14 h-14 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Promise band */}
        <section className="py-20 md:py-28 bg-secondary/15 border-y border-secondary/20" data-testid="section-about-promise">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-5">
              {t.about.promiseTitle}
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              {t.about.promiseText}
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="container relative z-10 mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
              {t.about.ctaSectionTitle}
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/85 mb-10">
              {t.about.ctaSectionSub}
            </p>
            <Button
              size="lg"
              className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-10 text-base font-semibold shadow-xl"
              onClick={() => setLocation("/products")}
              data-testid="button-about-cta-shop"
            >
              {t.about.ctaSectionBtn}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
