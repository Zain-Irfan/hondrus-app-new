import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/hooks/use-language";

const brandConceptsEs = [
  {
    name: "Sabores de Honduras",
    tagline: "El sabor del hogar, entregado.",
    style: "Cálida, auténtica, tradicional pero limpia. Usa marrones profundos y terracota.",
    description: "Una traducción directa que comunica inmediatamente el propósito de la tienda. Evoca los recuerdos sensoriales de la cocina hondureña. La identidad visual debe sentirse como una versión premium de la tiendita del barrio.",
    colors: ["bg-[#5B3A29]", "bg-[#C45A3B]", "bg-[#F5F0E6]"],
    logoIdea: "Una olla de barro estilizada integrada en una tipografía serif elegante."
  },
  {
    name: "La Catracha Market",
    tagline: "Tu despensa hondureña a nivel nacional.",
    style: "Audaz, orgullosa, vibrante. Usa el azul de la bandera hondureña con detalles dorados.",
    description: "Abraza el orgulloso identificador cultural 'Catracho/a'. Es amigable, accesible e inmediatamente reconocible para la diáspora. Se siente como un mercado bullicioso y vibrante.",
    colors: ["bg-[#00205B]", "bg-[#D4AF37]", "bg-[#FFFFFF]"],
    logoIdea: "Una interpretación moderna y geométrica de las cinco estrellas de la bandera hondureña sobre una tipografía sans-serif en negrita."
  },
  {
    name: "Tierra Catracha",
    tagline: "De nuestra tierra a tu mesa.",
    style: "Terroso, orgánico, premium. Usa verdes de bosque y tonos cálidos de madera.",
    description: "Se enfoca en el origen de los productos: la tierra misma. Se siente ligeramente más premium y artesanal, ideal para café, chocolate y productos auténticos de alta calidad.",
    colors: ["bg-[#2A4B3C]", "bg-[#8B5A2B]", "bg-[#E9E5D9]"],
    logoIdea: "Una ilustración minimalista en líneas de montañas y un sol naciente, junto a una fuente elegante y aérea."
  },
  {
    name: "Honduras Direct",
    tagline: "Productos auténticos, sin fronteras.",
    style: "Moderno, eficiente, confiable. Usa azul marino y blanco limpio.",
    description: "Un enfoque de comercio electrónico más utilitario y moderno. Enfatiza la logística y la conveniencia de recibir productos hondureños en cualquier lugar de EE.UU. Genera confianza inmediata.",
    colors: ["bg-[#1E3A8A]", "bg-[#E2E8F0]", "bg-[#0F172A]"],
    logoIdea: "Una flecha elegante y hacia adelante integrada en la letra 'H', con una tipografía sans-serif tecnológica y en negrita."
  },
  {
    name: "Del Barrio Hondureño",
    tagline: "La pulpería que envía a todas partes.",
    style: "Nostálgico, cálido, enfocado en la comunidad. Usa colores vintage difuminados.",
    description: "Apela profundamente a la nostalgia. Recrea la sensación de caminar a la pulpería del barrio en Honduras. Es personal, cálido y altamente emotivo.",
    colors: ["bg-[#D97750]", "bg-[#4A6741]", "bg-[#F2E8C6]"],
    logoIdea: "Una tipografía de estilo pintado a mano con ligero desgaste vintage, con una pequeña ilustración de una casa tradicional."
  }
];

const brandConceptsEn = [
  {
    name: "Sabores de Honduras",
    tagline: "The taste of home, delivered.",
    style: "Warm, authentic, traditional but clean. Uses deep browns and terracotta.",
    description: "A direct translation that immediately communicates the store's purpose. Evokes sensory memories of Honduran cooking. The visual identity should feel like a premium version of the neighborhood corner store.",
    colors: ["bg-[#5B3A29]", "bg-[#C45A3B]", "bg-[#F5F0E6]"],
    logoIdea: "A stylized clay pot integrated into an elegant serif typeface."
  },
  {
    name: "La Catracha Market",
    tagline: "Your Honduran pantry, nationwide.",
    style: "Bold, proud, vibrant. Uses the Honduran flag blue with gold accents.",
    description: "Embraces the proud cultural identifier 'Catracho/a'. Friendly, accessible, and immediately recognizable to the diaspora. Feels like a bustling, vibrant market.",
    colors: ["bg-[#00205B]", "bg-[#D4AF37]", "bg-[#FFFFFF]"],
    logoIdea: "A modern, geometric interpretation of the five stars from the Honduran flag over bold sans-serif typography."
  },
  {
    name: "Tierra Catracha",
    tagline: "From our land to your table.",
    style: "Earthy, organic, premium. Uses forest greens and warm wood tones.",
    description: "Focuses on the origin of the products: the land itself. Feels slightly more premium and artisanal, ideal for coffee, chocolate, and high-quality authentic products.",
    colors: ["bg-[#2A4B3C]", "bg-[#8B5A2B]", "bg-[#E9E5D9]"],
    logoIdea: "A minimalist line illustration of mountains and a rising sun, paired with an elegant, airy typeface."
  },
  {
    name: "Honduras Direct",
    tagline: "Authentic products, no borders.",
    style: "Modern, efficient, trustworthy. Uses navy blue and clean white.",
    description: "A more utilitarian and modern ecommerce approach. Emphasizes logistics and the convenience of receiving Honduran products anywhere in the US. Builds immediate trust.",
    colors: ["bg-[#1E3A8A]", "bg-[#E2E8F0]", "bg-[#0F172A]"],
    logoIdea: "A sleek forward-pointing arrow integrated into the letter 'H', with bold tech-style sans-serif typography."
  },
  {
    name: "Del Barrio Hondureño",
    tagline: "The corner store that ships everywhere.",
    style: "Nostalgic, warm, community-focused. Uses faded vintage colors.",
    description: "Appeals deeply to nostalgia. Recreates the feeling of walking to the neighborhood pulpería in Honduras. Personal, warm, and highly emotional.",
    colors: ["bg-[#D97750]", "bg-[#4A6741]", "bg-[#F2E8C6]"],
    logoIdea: "A hand-painted-style typeface with slight vintage wear, with a small illustration of a traditional house."
  }
];

export default function Brands() {
  const { t, lang } = useLanguage();
  const brandConcepts = lang === "en" ? brandConceptsEn : brandConceptsEs;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">{t.brands.title}</h1>
            <p className="text-lg text-muted-foreground">{t.brands.subtitle}</p>
          </div>

          <div className="space-y-24">
            {brandConcepts.map((concept, idx) => (
              <div key={idx} className="grid md:grid-cols-2 gap-10 items-center">
                <div className={`order-2 ${idx % 2 !== 0 ? 'md:order-1' : 'md:order-2'}`}>
                  <div className="bg-muted/30 p-10 rounded-2xl border aspect-video flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-transparent z-0" />
                    <div className="relative z-10 w-full">
                      <h2 className="text-4xl font-serif font-bold mb-4">{concept.name}</h2>
                      <p className="text-lg font-medium italic text-muted-foreground mb-8">"{concept.tagline}"</p>
                      <div className="flex justify-center gap-3 mb-8">
                        {concept.colors.map((color, i) => (
                          <div key={i} className={`w-12 h-12 rounded-full shadow-inner border border-white/20 ${color}`} />
                        ))}
                      </div>
                      <div className="bg-background/80 backdrop-blur p-4 rounded-lg inline-block text-sm border shadow-sm">
                        <span className="font-semibold text-primary block mb-1">{t.brands.logoLabel}</span>
                        {concept.logoIdea}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`order-1 space-y-6 ${idx % 2 !== 0 ? 'md:order-2' : 'md:order-1'}`}>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold tracking-wide">
                    {t.brands.direction} 0{idx + 1}
                  </div>
                  <h3 className="text-3xl font-bold">{concept.name}</h3>
                  <div className="prose prose-lg text-muted-foreground">
                    <p>{concept.description}</p>
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                      <strong>{t.brands.styleLabel}:</strong> {concept.style}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
