import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Terms() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última actualización: 7 de mayo de 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">1. Aceptación de los términos</h2>
              <p>
                Al usar el sitio web o la aplicación móvil de Sabores de Honduras, aceptas estos términos y
                condiciones. Si no estás de acuerdo, por favor no uses nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">2. Productos y precios</h2>
              <p>
                Hacemos lo posible por mostrar precios e imágenes precisas. Los precios pueden cambiar sin
                previo aviso. Nos reservamos el derecho de cancelar pedidos con errores de precio o de
                disponibilidad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">3. Pedidos y pagos</h2>
              <p>
                Aceptamos las principales tarjetas de crédito y débito vía Stripe. El cargo se realiza al
                confirmar el pedido. Te enviaremos un correo de confirmación con el número de orden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">4. Envíos</h2>
              <p>
                Enviamos a todo Estados Unidos vía UPS y FedEx. Los costos y tiempos de entrega se muestran
                al momento de pagar. No nos hacemos responsables por retrasos del transportista.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">5. Devoluciones</h2>
              <p>
                Por tratarse de productos alimenticios y perecederos, no aceptamos devoluciones excepto en
                casos de productos dañados o incorrectos. Contáctanos dentro de 48 horas tras recibir tu
                pedido.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">6. Cuentas de usuario</h2>
              <p>
                Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad en tu
                cuenta. Notifícanos de inmediato sobre cualquier uso no autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">7. Propiedad intelectual</h2>
              <p>
                Todo el contenido del sitio (texto, imágenes, logos, diseño) es propiedad de Sabores de
                Honduras o de sus respectivos dueños y está protegido por las leyes de derechos de autor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">8. Limitación de responsabilidad</h2>
              <p>
                Sabores de Honduras no será responsable por daños indirectos, incidentales o consecuentes
                derivados del uso de nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">9. Modificaciones</h2>
              <p>
                Podemos actualizar estos términos en cualquier momento. La fecha de la última actualización
                aparece en la parte superior de esta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-6 mb-2">10. Contacto</h2>
              <p>
                Para preguntas sobre estos términos, escríbenos a{" "}
                <a href="mailto:soporte@saboresdehonduras.com" className="text-primary underline">
                  soporte@saboresdehonduras.com
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
