import { Router, type IRouter } from "express";

const router: IRouter = Router();

const NEW_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const NEW_DETAILS_BASE = "https://places.googleapis.com/v1/places";

interface AddressComponent {
  types: string[];
  longText: string;
  shortText: string;
}

function pick(components: AddressComponent[], type: string, short = false): string {
  const c = components.find((x) => x.types.includes(type));
  if (!c) return "";
  return short ? c.shortText : c.longText;
}

router.get("/places/autocomplete", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "not_configured", message: "Google Maps API key is not configured" });
      return;
    }
    const input = String(req.query.input ?? "").trim();
    if (input.length < 2) {
      res.json({ suggestions: [] });
      return;
    }
    const r = await fetch(NEW_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["us", "hn"],
        languageCode: "en",
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      req.log.warn({ status: r.status, body: text.slice(0, 500) }, "Places autocomplete failed");
      res.status(502).json({ error: "upstream_error", suggestions: [] });
      return;
    }
    const data = (await r.json()) as any;
    const suggestions = Array.isArray(data?.suggestions)
      ? data.suggestions
          .map((s: any) => s.placePrediction)
          .filter((p: any) => p && p.placeId)
          .map((p: any) => ({
            placeId: p.placeId as string,
            description: p?.text?.text as string,
            mainText: p?.structuredFormat?.mainText?.text as string,
            secondaryText: p?.structuredFormat?.secondaryText?.text as string,
          }))
      : [];
    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Places autocomplete error");
    res.status(500).json({ error: "internal_error", suggestions: [] });
  }
});

router.get("/places/details", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "not_configured" });
      return;
    }
    const placeId = String(req.query.placeId ?? "").trim();
    if (!placeId) {
      res.status(400).json({ error: "missing_placeId" });
      return;
    }
    const r = await fetch(`${NEW_DETAILS_BASE}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "addressComponents,formattedAddress",
      },
    });
    if (!r.ok) {
      const text = await r.text();
      req.log.warn({ status: r.status, body: text.slice(0, 500) }, "Places details failed");
      res.status(502).json({ error: "upstream_error" });
      return;
    }
    const data = (await r.json()) as any;
    const components: AddressComponent[] = Array.isArray(data?.addressComponents) ? data.addressComponents : [];
    const ALLOWED_COUNTRIES = new Set(["US", "HN"]);
    const country = pick(components, "country", true);
    if (country && !ALLOWED_COUNTRIES.has(country)) {
      res.status(422).json({
        error: "unsupported_country",
        message: "We currently ship to addresses in the US and Honduras only",
      });
      return;
    }
    const streetNumber = pick(components, "street_number");
    const route = pick(components, "route");
    res.json({
      formattedAddress: data?.formattedAddress ?? "",
      line1: [streetNumber, route].filter(Boolean).join(" "),
      city:
        pick(components, "locality") ||
        pick(components, "sublocality") ||
        pick(components, "postal_town"),
      state: pick(components, "administrative_area_level_1", true),
      zipCode: pick(components, "postal_code"),
      country,
    });
  } catch (err) {
    req.log.error({ err }, "Places details error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
