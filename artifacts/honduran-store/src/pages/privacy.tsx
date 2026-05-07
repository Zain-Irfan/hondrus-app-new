import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última actualización: 7 de mayo de 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">1. Introducción</h2>
              <p>
                Sabores de Honduras ("nosotros", "la tienda") respeta tu privacidad. Esta política explica
                qué información recopilamos, cómo la usamos y los derechos que tienes sobre tus datos cuando
                usas nuestro sitio web y aplicación móvil.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">2. Información que recopilamos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cuenta:</strong> nombre, correo electrónico y contraseña (gestionados por Clerk).</li>
                <li><strong>Pedidos:</strong> dirección de envío, número de teléfono e historial de compras.</li>
                <li><strong>Pagos:</strong> los datos de tu tarjeta los procesa Stripe directamente; nosotros no almacenamos números de tarjeta completos.</li>
                <li><strong>Uso del sitio:</strong> páginas visitadas, productos vistos, dispositivo y dirección IP, mediante cookies y registros del servidor.</li>
                <li><strong>Direcciones (autocompletar):</strong> consultas de dirección procesadas por la API de Google Places.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">3. Cómo usamos tu información</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Procesar y enviar tus pedidos.</li>
                <li>Comunicarnos contigo sobre tu cuenta, pedidos y soporte al cliente.</li>
                <li>Mejorar nuestros productos, sitio web y aplicación.</li>
                <li>Prevenir fraude y cumplir con la ley.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">4. Terceros con los que compartimos datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Clerk</strong> — autenticación y gestión de cuentas.</li>
                <li><strong>Stripe</strong> — procesamiento de pagos.</li>
                <li><strong>Google Maps / Places</strong> — autocompletado de direcciones.</li>
                <li><strong>UPS / FedEx / USPS</strong> — envío y seguimiento de paquetes.</li>
                <li><strong>Proveedores de hosting</strong> (Railway, Replit) — almacenamiento de la base de datos y operación del servidor.</li>
              </ul>
              <p>No vendemos tus datos personales a terceros.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">5. Cookies</h2>
              <p>
                Usamos cookies esenciales para mantener tu sesión iniciada y conservar el contenido de tu carrito.
                No usamos cookies de publicidad ni de seguimiento de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">6. Tus derechos</h2>
              <p>Puedes solicitar en cualquier momento:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceso a la información que tenemos sobre ti.</li>
                <li>Corrección o actualización de tus datos.</li>
                <li>Eliminación de tu cuenta y datos asociados.</li>
              </ul>
              <p>
                Para ejercer estos derechos, contáctanos en{" "}
                <a href="mailto:soporte@saboresdehonduras.com" className="text-primary underline">
                  soporte@saboresdehonduras.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">7. Seguridad</h2>
              <p>
                Usamos cifrado HTTPS en todo el sitio y la app. Las contraseñas se almacenan con hash mediante
                Clerk. Aun así, ningún sistema en internet es 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">8. Menores de edad</h2>
              <p>
                Nuestro servicio está dirigido a mayores de 18 años. No recopilamos a sabiendas información
                de menores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">9. Cambios a esta política</h2>
              <p>
                Podemos actualizar esta política. Publicaremos la fecha de la última actualización en la
                parte superior de esta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">10. Contacto</h2>
              <p>
                Sabores de Honduras<br />
                Correo:{" "}
                <a href="mailto:soporte@saboresdehonduras.com" className="text-primary underline">
                  soporte@saboresdehonduras.com
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
