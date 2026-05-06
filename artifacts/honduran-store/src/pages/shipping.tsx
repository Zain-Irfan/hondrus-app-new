import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Truck, Clock, ShieldCheck, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Shipping() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-6">{t.shipping.title}</h1>
          <p className="text-lg text-muted-foreground mb-12">{t.shipping.subtitle}</p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-background border rounded-xl p-6 shadow-sm flex gap-4">
              <Truck className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-2">{t.shipping.carriersTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.shipping.carriersSub}</p>
              </div>
            </div>
            <div className="bg-background border rounded-xl p-6 shadow-sm flex gap-4">
              <Clock className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-2">{t.shipping.processingTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.shipping.processingSub}</p>
              </div>
            </div>
            <div className="bg-background border rounded-xl p-6 shadow-sm flex gap-4">
              <MapPin className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-2">{t.shipping.coverageTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.shipping.coverageSub}</p>
              </div>
            </div>
            <div className="bg-background border rounded-xl p-6 shadow-sm flex gap-4">
              <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-2">{t.shipping.freeTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.shipping.freeSub}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t.shipping.perishableTitle}</h2>
            <p>{t.shipping.perishableP}</p>
            <ul>
              {t.shipping.perishableList.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">{t.shipping.trackingTitle}</h2>
            <p>{t.shipping.trackingP}</p>
            <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">{t.shipping.lostTitle}</h2>
            <p>{t.shipping.lostP}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
