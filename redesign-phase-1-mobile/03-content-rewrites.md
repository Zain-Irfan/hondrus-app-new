# Sabores de Honduras — Spanish Content & Microcopy

## Voice principles

1. **Casero, no corporativo.** Like a friend who runs a small market and knows you by name.
2. **Honest, never hyped.** "Café de Marcala, recién tostado" — not "El mejor café del mundo."
3. **Specific is warm.** Mention the region, the producer, the technique. "Tostado por Don Mauricio en Comayagua" beats "Premium quality."
4. **Brevity over balance.** Short sentences. Clear verbs. No filler.
5. **Honduran Spanish, not neutral.** "Pulpería," "vos" is okay in casual moments, "platanitos" not "plátanos verdes." We sound like home, not Madrid.
6. **No English fallbacks anywhere.** Every key has a Spanish value.

## Tone matrix

| Situation | Tone | Example |
|---|---|---|
| Welcome / hero | Warm, evocative | *Lo de casa, hasta tu puerta.* |
| Browse / catalog | Neutral, informative | *Café · Marcala* |
| Empty state (no results) | Helpful, hopeful | *No encontramos eso. Probá con "café" o "rosquillas."* |
| Error | Calm, direct | *No pudimos guardar tu dirección. Volvé a intentar.* |
| Success | Quietly celebratory | *¡Listo! Tu pedido va en camino.* |
| Confirmation needed | Plain | *¿Vaciar el carrito?* |
| Empty cart | Inviting | *Tu carrito está esperando. Empezá por el café.* |
| Low stock warning | Urgent but kind | *Quedan 3 — pedilo antes que se agoten.* |
| Sign-in nudge | Benefit-led | *Iniciá sesión y ahorrate escribir tu dirección cada vez.* |
| Free shipping unlocked | Cheerful | *¡Envío gratis desbloqueado!* |

## Replacement copy table

This is a drop-in for the existing translations file. New keys have a `// new` comment.

```ts
// app/sabores-mobile/lib/i18n/es.ts (or equivalent)

const es = {
  // Brand
  appName: "Sabores",
  appTagline: "Lo de casa, hasta tu puerta.",

  // Tabs
  tabHome: "Inicio",
  tabBrowse: "Tienda",          // was "Catálogo"
  tabCart: "Carrito",
  tabOrders: "Pedidos",         // promoted to top-level
  tabAccount: "Cuenta",

  // Home
  heroTagline: "DIRECTO DE HONDURAS",
  heroTitle: "Lo de casa,\nhasta tu puerta.",
  heroSub: "Productos hondureños auténticos, enviados a todo Estados Unidos.",
  shopNow: "Comprar ahora",
  continueShopping: "Continuar comprando",                              // new
  bestsellers: "Más vendidos",
  newArrivals: "Recién llegados",
  meetProducers: "Conocé a quienes lo hacen",                          // new
  shopByRegion: "Comprá por región",                                    // new
  fastShipping: "Llega rápido",
  fastShippingSub: "5–7 días hábiles · Envío gratis sobre $75",

  // Categories (remain)
  catCoffee: "Café",
  catBaked: "Panadería",
  catPantry: "Despensa",
  catDairy: "Lácteos",
  catSnacks: "Bocadillos",
  catSweets: "Dulces",
  catBeverages: "Bebidas",
  catSauces: "Salsas",

  // Catalog
  catAll: "Todo",
  searchPlaceholderCatalog: "Buscar productos…",
  searchPlaceholderHome: "¿Qué buscás hoy?",
  filtersTitle: "Filtros",                                              // new
  sortBy: "Ordenar por",                                                // new
  sortRecommended: "Recomendados",                                      // new
  sortPriceLowHigh: "Precio: menor a mayor",                            // new
  sortPriceHighLow: "Precio: mayor a menor",                            // new
  sortNewest: "Más recientes",                                          // new
  sortRating: "Mejor calificados",                                      // new
  filterDietary: "Tipo",                                                // new
  filterRegion: "Región",                                               // new
  filterPrice: "Precio",                                                // new
  filterInStock: "Solo disponibles",                                    // new
  filterApply: "Aplicar filtros",                                       // new
  filterClearAll: "Limpiar todo",                                       // new
  filterCount: (n: number) => `${n} ${n === 1 ? "filtro" : "filtros"}`, // new

  // Empty / no results
  noProductsFound: "No encontramos lo que buscás",
  noResultsFiltered: (term: string) =>
    `Probá con otro término o quitá los filtros. Buscaste: "${term}".`,
  clearCategories: "Quitar filtros",
  backToHome: "Volver al inicio",
  recentSearches: "Búsquedas recientes",
  popularSearches: "Lo que más buscan",
  clearAll: "Borrar",

  // Product detail
  bestseller: "Más vendido",
  outOfStock: "Agotado",
  lowStock: (n: number) => `Quedan ${n} — pedilo pronto`,               // new
  reviews: (n: number) => n === 1 ? "(1 reseña)" : `(${n} reseñas)`,
  addToCart: (price: string) => `Agregar · $${price}`,
  added: "¡Agregado!",
  saveForLater: "Guardar para después",                                 // new
  shareProduct: "Compartir",                                            // new
  pairsWith: "Combina bien con",                                        // new
  fromBrand: (brand: string) => `Más de ${brand}`,                      // new
  description: "Descripción",                                           // new
  ingredients: "Ingredientes",                                          // new
  origin: "Origen",                                                     // new
  howToUse: "Cómo se usa",                                              // new

  // Cart
  cartTitle: (n: number) => `Mi carrito · ${n} ${n === 1 ? "producto" : "productos"}`,
  emptyCart: "Tu carrito está esperando.\nEmpezá por el café.",
  startShopping: "Empezar a comprar",                                   // new
  clearCart: "Vaciar carrito",
  clearCartConfirm: "¿Querés vaciar todo el carrito?",                  // new
  perUnit: "c/u",                                                        // shorter than "por unidad"
  subtotal: "Subtotal",
  shippingLabel: "Envío",
  shippingCalculated: "Se calcula al pagar",
  estimatedDelivery: (range: string) => `Llega ${range}`,               // new
  free: "Gratis",
  freeShippingProgress: (amount: string) =>
    `Te faltan $${amount} para envío gratis`,
  freeShippingCongrats: "¡Envío gratis desbloqueado!",
  estimatedTotal: "Total estimado",
  payNow: "Ir a pagar",
  promoCode: "¿Tenés un código?",                                       // new
  promoApply: "Aplicar",                                                 // new

  // Checkout
  contactInfo: "Datos de contacto",
  shippingAddress: "Dirección de envío",
  paymentSection: "Pago",                                                // new
  reviewSection: "Revisar y confirmar",                                  // new
  orderSummary: "Resumen del pedido",
  yourName: "Tu nombre",
  email: "Correo electrónico",
  fullName: "Nombre completo de quien recibe",                          // clearer
  addressLine1: "Dirección",
  addressLine1Placeholder: "Calle, número, apartamento",
  addressLine2: "Apartamento, suite, etc. (opcional)",
  addressLine2Placeholder: "Ej: Apt 3B",
  city: "Ciudad",
  state: "Estado",
  zip: "Código postal",
  phone: "Teléfono",
  orderNotes: "Mensaje o instrucciones (opcional)",                     // new
  orderNotesPlaceholder: "Ej: Dejar en el porche · Regalo para mi mamá",// new
  signedInAs: (name: string) => `Sesión iniciada como ${name}`,
  savedAddressUsed: "Dirección guardada",
  signInForFasterCheckout: "Iniciá sesión y pagá más rápido",
  signInCheckoutDesc: "Usamos tu dirección guardada y guardamos este pedido en tu historial.",
  freeShippingOnOrder: "¡Envío gratis en este pedido!",
  paymentSecureNote: "Tu pago es seguro. Procesado por Stripe.",
  confirmOrder: (total: string) => `Pagar $${total}`,                   // shorter than "Confirmar pedido"
  payWithApplePay: "Pagar con Apple Pay",                               // new
  payWithGooglePay: "Pagar con Google Pay",                             // new
  incompleteFields: "Faltan datos",
  incompleteFieldsMsg: "Completá los campos marcados antes de continuar.",
  orderError: "No pudimos procesar tu pedido",
  orderErrorMsg: "Hubo un problema. Volvé a intentar en un momento.",
  verifyingPayment: "Confirmando tu pago…",
  verifyingPaymentDesc: "Terminá el pago en el navegador. Esta pantalla se actualiza sola.",
  creatingOrder: "Creando tu pedido…",
  cancelPayment: "Cancelar",
  paymentPending: "Pago no completado",
  paymentPendingMsg: "El pago quedó pendiente. Volvé a intentar cuando quieras.",
  almostFreeShipping: (amount: string) =>
    `Agregá $${amount} más y el envío te sale gratis`,                  // new

  // Order success
  orderConfirmed: "¡Listo! Tu pedido va en camino.",
  orderReceived: (n: string) => `Pedido #${n}. Te enviamos un correo de confirmación.`,
  confirmationLabel: "Correo de confirmación",
  confirmationValue: "Llega en unos minutos a tu bandeja",
  shippingVia: "Envío estándar · 5–7 días hábiles",
  trackingLabel: "Tu número de rastreo",
  trackingValuePending: "Te lo enviamos por correo cuando salga del centro de envíos.", // new
  thanksTitle: "Gracias por apoyar a productores hondureños",
  thanksSub: "Cada pedido sostiene familias en Honduras.",
  viewOrder: "Ver pedido",
  backHome: "Volver al inicio",
  shareReferralCard: "Compartí Sabores",                                // new
  shareReferralDesc: "Tu amigo recibe $10 en su primer pedido. Vos recibís $10 cuando complete su compra.", // new
  shareReferralCta: "Invitar a un amigo",                               // new

  // Status
  statusPending: "Pendiente",
  statusConfirmed: "Confirmado",
  statusProcessing: "En empaque",                                       // was "Processing"
  statusShipped: "Enviado",
  statusDelivered: "Entregado",
  statusCancelled: "Cancelado",
  statusOnTheWay: "En camino",                                          // new
  statusOutForDelivery: "Sale a entregar hoy",                          // new

  // Orders list
  filterActive: "Activos",                                              // new
  filterDelivered: "Entregados",                                        // new
  filterCancelled: "Cancelados",                                        // new
  reorder: "Volver a pedir",                                            // new
  trackPackage: "Rastrear envío",                                       // new
  orderTotal: "Total",
  itemsInOrder: (n: number) => n === 1 ? "1 producto" : `${n} productos`,
  showItems: (n: number) => `Ver los ${n} productos`,
  hideItems: (n: number) => "Ocultar productos",
  placedOn: "Realizado el",
  emptyOrders: "Aún no hiciste tu primer pedido",                       // new
  emptyOrdersSub: "Cuando hagas un pedido, lo vas a poder ver y rastrear acá.", // new

  // Account
  accountTitle: "Mi cuenta",
  accountSubGuest: "Iniciá sesión o creá tu cuenta para ver tus pedidos y guardar tu dirección.",
  welcomeCardTitle: "Bienvenido a Sabores",
  welcomeCardSub: "Iniciá sesión o creá tu cuenta para guardar tu dirección y rastrear tus pedidos.",
  signInButton: "Iniciar sesión",
  createAccount: "Crear cuenta",
  guestOrdersTitle: "Ver pedidos como invitado",
  guestOrdersSub: "¿Hiciste un pedido sin crear cuenta? Lo encontramos por tu correo.",
  benefitOrders: "Mirá tu historial de pedidos completo",
  benefitAddress: "Guardá tu dirección de envío",
  benefitCheckout: "Pagá más rápido la próxima vez",
  helloUser: (name: string) => `¡Hola, ${name}!`,                       // new
  memberSince: (date: string) => `Miembro desde ${date}`,               // new
  myAddresses: "Mis direcciones",                                       // new
  myFavorites: "Favoritos",                                             // new
  notifications: "Notificaciones",                                      // new
  helpCenter: "Ayuda y soporte",                                        // new
  language: "Idioma",
  signOut: "Cerrar sesión",
  signOutConfirm: "¿Cerrar sesión?",                                    // new

  // Errors
  loading: "Cargando…",
  productNotFound: "No encontramos ese producto",
  goBack: "Volver",
  networkError: "Sin conexión. Revisá tu internet.",                    // new
  retryLabel: "Reintentar",                                             // new

  // Help
  needHelp: "¿Necesitás ayuda?",
  needHelpSub: "Estamos acá para vos. Escribinos o llamanos.",
  contactPhone: "Llamar",
  contactEmail: "Correo",

  // Misc
  chooseLanguage: "Elegir idioma",
  clearSearch: "Limpiar búsqueda",
  quantity: "Cantidad",
};
```

## Notable removals

- `t.payNow = "Ir a pagar"` ← was "PROCEDER AL PAGO" (caps shouting)
- `confirmOrder` ← was "Confirmar pedido" (vague), now "Pagar $XX.XX" (commits to action + amount)
- Status values: "Processing" became "En empaque" (concrete) instead of an abstract noun
- `searchPlaceholderHome` ← was "Buscar productos auténticos…", now "¿Qué buscás hoy?" (conversational)
- `emptyCart` ← gentle invitation rather than "Your cart is empty."

## What needs writing fresh (not in this doc)

- Producer story copy (3 short profiles): Don Mauricio (Comayagua coffee), Doña Rosa (rosquillas Olancho), Familia Vásquez (quesillo de Olancho).
- Push notification templates (order shipped, delivery today, abandoned cart).
- Email transactional copy (order confirmation, shipping confirmation, delivery, review request).
- FAQ rewrites (currently lives on web, also needed in mobile help center).
