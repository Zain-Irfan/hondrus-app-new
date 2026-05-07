import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Terms() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">
            Terms and Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: May 7, 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">1. Acceptance of terms</h2>
              <p>
                By using the HN Grocers website or mobile app, you agree to these terms and
                conditions. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">2. Products and pricing</h2>
              <p>
                We make every effort to display accurate prices and images. Prices may change without
                notice. We reserve the right to cancel orders that contain pricing or availability errors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">3. Orders and payment</h2>
              <p>
                We accept major credit and debit cards via Stripe. Your card is charged when you confirm
                the order. We will email you an order confirmation with your order number.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">4. Shipping</h2>
              <p>
                We ship across the United States via UPS and FedEx. Shipping costs and delivery times are
                shown at checkout. We are not responsible for carrier delays.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">5. Returns</h2>
              <p>
                Because we sell perishable food products, we do not accept returns except for damaged or
                incorrect items. Contact us within 48 hours of receiving your order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">6. User accounts</h2>
              <p>
                You are responsible for keeping your password confidential and for all activity on your
                account. Notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">7. Intellectual property</h2>
              <p>
                All site content (text, images, logos, design) is the property of HN Grocers or its
                respective owners and is protected by copyright law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">8. Limitation of liability</h2>
              <p>
                HN Grocers shall not be liable for indirect, incidental, or consequential damages
                arising from the use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">9. Changes</h2>
              <p>
                We may update these terms at any time. The date of the most recent update appears at the
                top of this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">10. Contact</h2>
              <p>
                For questions about these terms, email us at{" "}
                <a href="mailto:support@hngrocers.com" className="text-primary underline">
                  support@hngrocers.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
