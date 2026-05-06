import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/hooks/use-language";

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{t.faq.title}</h1>
            <p className="text-lg text-muted-foreground">{t.faq.subtitle}</p>
          </div>

          <div className="space-y-12">
            {t.faq.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold mb-6 pb-2 border-b">{section.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left text-lg font-medium">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed text-base">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
            <h3 className="text-xl font-bold mb-2">{t.faq.moreQuestions}</h3>
            <p className="text-muted-foreground mb-6">{t.faq.moreQuestionsSub}</p>
            <a href="/contact" className="inline-block bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">
              {t.faq.contactUs}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
