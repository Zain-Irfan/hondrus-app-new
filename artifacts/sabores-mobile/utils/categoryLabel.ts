/** Map API English category names / slugs to i18n translation keys. */
const SLUG_KEYS: Record<string, string> = {
  coffee: "catCoffee",
  "baked-goods": "catBaked",
  pantry: "catPantry",
  dairy: "catDairy",
  snacks: "catSnacks",
  sweets: "catSweets",
  beverages: "catBeverages",
  sauces: "catSauces",
};

const NAME_KEYS: Record<string, string> = {
  coffee: "catCoffee",
  café: "catCoffee",
  cafe: "catCoffee",
  "baked goods & breads": "catBaked",
  "baked goods": "catBaked",
  panadería: "catBaked",
  "pantry staples": "catPantry",
  pantry: "catPantry",
  despensa: "catPantry",
  "dairy & cheeses": "catDairy",
  dairy: "catDairy",
  lácteos: "catDairy",
  snacks: "catSnacks",
  bocadillos: "catSnacks",
  "sweets & desserts": "catSweets",
  sweets: "catSweets",
  dulces: "catSweets",
  beverages: "catBeverages",
  bebidas: "catBeverages",
  "sauces & condiments": "catSauces",
  sauces: "catSauces",
  salsas: "catSauces",
};

export function localizeCategoryName(
  t: Record<string, any>,
  categoryName?: string | null,
  slug?: string | null,
): string {
  if (slug && SLUG_KEYS[slug] && t[SLUG_KEYS[slug]]) {
    return t[SLUG_KEYS[slug]];
  }
  if (categoryName) {
    const key = NAME_KEYS[categoryName.trim().toLowerCase()];
    if (key && t[key]) return t[key];
  }
  return categoryName ?? "";
}
