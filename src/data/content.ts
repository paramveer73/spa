import seed from "./seed.json";

export interface Price {
  amount: number | null;
  currency: string;
  display: string | null;
  qualifier: string | null;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  price: Price;
  bookingUrl: string;
  landing: { sourceSlug: string; headline: string | null; guarantee: string | null } | null;
  detail: { sourceSlug: string; intro: string | null; sections: { heading: string; body: string }[] } | null;
  faqs: { question: string; answer: string | null }[];
  seo: { title: string | null; description: string | null };
}

const data = seed as unknown as {
  business: typeof seed.business;
  stylist: typeof seed.stylist;
  services: Service[];
  bundles: typeof seed.bundles;
  testimonials: typeof seed.testimonials;
  faqs: typeof seed.faqs;
  home: typeof seed.home;
};

export const business = data.business;
export const stylist = data.stylist;
export const bundles = data.bundles;
export const testimonials = data.testimonials;
export const faqs = data.faqs;
export const home = data.home;

/** Everything bookable, minus the two consultation entries. */
export const services = data.services.filter((s) => s.category !== "consultation");

/** The four headline treatments, in the order the studio leads with them. */
const FEATURED = ["microblading", "lash-lift", "pmu-removal", "teeth-whitening"];
export const featuredServices = FEATURED.map(
  (id) => data.services.find((s) => s.id === id)!
).filter(Boolean);

export const browMapping = data.services.find((s) => s.id === "brow-mapping")!;
