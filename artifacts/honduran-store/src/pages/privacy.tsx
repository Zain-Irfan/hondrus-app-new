import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: May 7, 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">1. Introduction</h2>
              <p>
                Honduras Grocers ("we", "us", "the store") respects your privacy. This policy explains
                what information we collect, how we use it, and the rights you have over your data when
                you use our website and mobile app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">2. Information we collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account:</strong> name, email address, and password (managed by Clerk).</li>
                <li><strong>Orders:</strong> shipping address, phone number, and purchase history.</li>
                <li><strong>Payments:</strong> card details are processed directly by Stripe; we do not store full card numbers.</li>
                <li><strong>Site usage:</strong> pages visited, products viewed, device info, and IP address, via cookies and server logs.</li>
                <li><strong>Address autocomplete:</strong> address queries processed by the Google Places API.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">3. How we use your information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and ship your orders.</li>
                <li>Communicate with you about your account, orders, and customer support.</li>
                <li>Improve our products, website, and app.</li>
                <li>Prevent fraud and comply with the law.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">4. Third parties we share data with</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Clerk</strong> — authentication and account management.</li>
                <li><strong>Stripe</strong> — payment processing.</li>
                <li><strong>Google Maps / Places</strong> — address autocomplete.</li>
                <li><strong>UPS / FedEx / USPS</strong> — shipping and package tracking.</li>
                <li><strong>Hosting providers</strong> (Railway, Replit) — database storage and server operation.</li>
              </ul>
              <p>We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">5. Cookies</h2>
              <p>
                We use essential cookies to keep you signed in and to preserve the contents of your cart.
                We do not use advertising cookies or third-party tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">6. Your rights</h2>
              <p>You may request at any time:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to the information we hold about you.</li>
                <li>Correction or update of your data.</li>
                <li>Deletion of your account and associated data.</li>
              </ul>
              <p>
                To exercise these rights, contact us at{" "}
                <a href="mailto:support@hondurasgrocers.com" className="text-primary underline">
                  support@hondurasgrocers.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">7. Security</h2>
              <p>
                We use HTTPS encryption across the entire site and app. Passwords are stored hashed via
                Clerk. Even so, no system on the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">8. Minors</h2>
              <p>
                Our service is intended for users aged 18 and over. We do not knowingly collect
                information from minors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">9. Changes to this policy</h2>
              <p>
                We may update this policy. We will post the date of the latest update at the top of this
                page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">10. Contact</h2>
              <p>
                Honduras Grocers<br />
                Email:{" "}
                <a href="mailto:support@hondurasgrocers.com" className="text-primary underline">
                  support@hondurasgrocers.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
