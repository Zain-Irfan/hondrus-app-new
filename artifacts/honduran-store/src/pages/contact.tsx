import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";

export default function Contact() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: t.contact.toastTitle, description: t.contact.toastDesc });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20 bg-muted/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">{t.contact.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.contact.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-5 gap-12 items-start">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-background rounded-2xl p-8 shadow-sm border border-border/50">
                <h3 className="text-2xl font-bold mb-6">{t.contact.getInTouch}</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t.contact.emailTitle}</h4>
                      <p className="text-muted-foreground text-sm mb-1">{t.contact.emailSub}</p>
                      <a href="mailto:hola@saboresdehonduras.com" className="text-primary hover:underline font-medium">hola@saboresdehonduras.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t.contact.phoneTitle}</h4>
                      <p className="text-muted-foreground text-sm mb-1">{t.contact.phoneSub}</p>
                      <a href="tel:+18005550199" className="text-primary hover:underline font-medium">+1 (800) 555-0199</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t.contact.officeTitle}</h4>
                      <p className="text-muted-foreground text-sm">1234 Catracho Way<br />Suite 100<br />Miami, FL 33101</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="bg-background rounded-2xl p-8 shadow-sm border border-border/50">
                <h3 className="text-2xl font-bold mb-6">{t.contact.sendMessage}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t.contact.firstName}</Label>
                      <Input id="firstName" required placeholder={t.contact.firstNamePH} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t.contact.lastName}</Label>
                      <Input id="lastName" required placeholder={t.contact.lastNamePH} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.contact.emailLabel}</Label>
                    <Input id="email" type="email" required placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t.contact.subject}</Label>
                    <Input id="subject" required placeholder={t.contact.subjectPH} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t.contact.message}</Label>
                    <Textarea id="message" required placeholder={t.contact.messagePH} className="min-h-[150px] resize-y" />
                  </div>
                  <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? t.contact.sending : (
                      <>{t.contact.send} <Send className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
