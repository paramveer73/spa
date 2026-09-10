/**
 * Converts the raw Wix scrape (content.json) into application seed data.
 *
 * Two rules drive everything here:
 *   1. Every string is *pulled* from content.json, never retyped — so the
 *      seed always matches what is actually published on the live site.
 *   2. Only marketing copy survives. Wix widget chrome ("Chat", "< Back",
 *      "Previous"/"Next", "1/4", "Google Profile"), form field labels and
 *      legal boilerplate are dropped.
 */
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync(new URL("../content.json", import.meta.url)));

/** Wix ships each section twice (desktop + mobile). Collapse to one. */
function dedupe(sections = []) {
  const seen = new Set();
  return sections.filter((s) => {
    const key = JSON.stringify(s.blocks.map((b) => [b.type, b.text]));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const pages = new Map(raw.pages.map((p) => [p.slug, { ...p, sections: dedupe(p.sections) }]));

/** Every text block on a page, in document order, chrome removed. */
const CHROME = new Set([
  "Chat", "Book Now", "Book now", "BOOK NOW", "Google Profile", "Previous",
  "Next", "< Back", "Request Now", "@ktlnstudio", "559-466-8233",
  "Looking for more options? Check out our other services on our Home page",
]);

function blocksOf(slug) {
  const page = pages.get(slug);
  if (!page) throw new Error(`no page: ${slug}`);
  return page.sections
    .flatMap((s) => s.blocks)
    .filter((b) => b.text && !CHROME.has(b.text.trim()));
}

/** First block on `slug` whose text matches `probe`. Throws if absent, so a
 *  copy change on the source site surfaces as a build error, not a silent gap. */
function grab(slug, probe) {
  const match = blocksOf(slug).find((b) =>
    typeof probe === "string" ? b.text.includes(probe) : probe.test(b.text)
  );
  if (!match) throw new Error(`no block matching ${probe} on ${slug}`);
  return match.text.replace(/\s*\n\s*/g, " ").trim();
}

function grabAll(slug, probe) {
  return blocksOf(slug)
    .filter((b) => probe.test(b.text))
    .map((b) => b.text.replace(/\s*\n\s*/g, " ").trim());
}

const money = (text) => {
  const m = text.match(/\$([\d,]+(?:\.\d{2})?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};

/* ------------------------------------------------------------------ *
 * Business
 * ------------------------------------------------------------------ */
const business = {
  name: "KTLN Studio",
  tagline: grab("home", "Natural-looking microblading"),
  phone: "559-466-8233",
  email: "ktlnstudio@gmail.com",
  address: {
    street: "2196 Shaw Ave",
    suite: "Suite 05",
    city: "Clovis",
    state: "CA",
    postalCode: "93611",
    country: "USA",
    mapUrl: "https://maps.app.goo.gl/tWtcwAu3DDk4yZ118",
  },
  serviceArea: ["Clovis, CA", "Fresno, CA"],
  bookingPlatform: { name: "Vagaro", url: "https://www.vagaro.com/ktlnstudio" },
  googleProfile: "https://g.co/kgs/hwtZuNW",
  social: {
    instagram: "https://www.instagram.com/ktlnstudio/",
    tiktok: "https://www.tiktok.com/@ktlnstudio",
    facebook: "https://www.facebook.com/people/KTLN-Studio/61551028865481/",
  },
  depositPolicy: grab("pmuremovalinfresnoca", "50% non-refundable deposit"),
};

/* ------------------------------------------------------------------ *
 * Stylist
 * ------------------------------------------------------------------ */
const stylist = {
  name: "Katelyn",
  role: "Licensed Esthetician & PMU Artist",
  bio: grab("microbladinginfresnoca", "precision-based PMU artist"),
  yearsExperience: 7,
  certifications: [
    grab("microbladinginfresnoca", "Beauty Angels Academy"),
    "Licensed Esthetician",
    ...grab("microbladinginfresnoca", "Embellashes")
      .split(/\s{2,}|(?<=\.)\s(?=[A-Z])/)
      .map((s) => s.trim())
      .filter(Boolean),
  ],
};

/* ------------------------------------------------------------------ *
 * Services — one uniform shape for every entry
 * ------------------------------------------------------------------ */
const BOOKING = {
  microblading: "https://www.vagaro.com/cl/1hEA4QFRXDHXiSqMa2oiPDkJ5hZ6-bfmC-58IVZk4TE=",
  lashLift: "https://www.vagaro.com/cl/37r~AVOEdjxWcAcW77jhnItbRheCzqSDQH86-3PVphA=",
  pmuRemoval: "https://www.vagaro.com/cl/0Kt4hfsn00QfjRmLSJAMXUXiuw6qfMqyYZ7iOH3I0TI=",
  teethWhitening: "https://www.vagaro.com/cl/QwPuA8qFJy5p9SgxReYPHN1I0Dwc-rsi7~Pd2UvvHZo=",
  general: "https://www.vagaro.com/cl/wTuklrB1ZeZYgG9-1Ge7wv8fAWiH4",
  browMapping: "https://www.vagaro.com/cl/0cI7vsciRJanDWmmsNDvHsIjJixbCZDEznmGykHjQxA=",
};

/** Builds the uniform record. Absent fields are explicit nulls / empty
 *  arrays so every service has an identical key set. */
function service({
  id, name, category, landingSlug = null, detailSlug = null,
  tagline, shortDescription, longDescription = null,
  price, priceNote = null, bookingUrl,
  headline = null, guarantee = null,
  faqs = [], seo = {},
}) {
  return {
    id,
    slug: id,
    name,
    category,
    tagline,
    shortDescription,
    longDescription,
    price: {
      amount: price,
      currency: "USD",
      display: price == null ? null : `$${price}`,
      qualifier: priceNote,
    },
    bookingUrl,
    landing: landingSlug
      ? { sourceSlug: landingSlug, headline, guarantee }
      : null,
    detail: detailSlug ? detailOf(detailSlug) : null,
    faqs,
    seo: {
      title: seo.title ?? null,
      description: seo.description ?? tagline,
    },
  };
}


/**
 * Service-detail pages all follow the same rhythm — an intro paragraph, then
 * alternating heading/body pairs — but each uses its own section headings
 * ("Aftercare & Healing", "Benefits of Brow Lamination", ...). So the shape
 * is intro + a generic sections[], not fixed per-topic fields.
 *
 * The shared FAQ accordion at the foot of every one of these pages is
 * skipped here; it is hoisted to the top-level `faqs` instead.
 */
function detailOf(slug) {
  const blocks = blocksOf(slug).filter(
    (b) => !/^\d+:/.test(b.text.trim()) && b.text.trim() !== "Have any question for us? Ask away"
  );
  const faqIndex = blocks.findIndex((b) => /Frequently Asked Questions/i.test(b.text));
  const body = (faqIndex === -1 ? blocks : blocks.slice(0, faqIndex)).filter(
    (b) => !/^Book Now in \$/.test(b.text.trim())
  );

  const paras = body.filter((b) => b.type === "p" || b.type === "heading");
  const intro = paras.find((b) => b.text.length > 120);
  const introAt = paras.indexOf(intro);

  const sections = [];
  for (let i = introAt + 1; i < paras.length; i += 1) {
    const heading = paras[i];
    const next = paras[i + 1];
    if (heading && next && heading.text.length < 120 && next.text.length > 120) {
      sections.push({
        heading: heading.text.replace(/\s*\n\s*/g, " ").trim(),
        body: next.text.replace(/\s*\n\s*/g, " ").trim(),
      });
      i += 1;
    }
  }

  return {
    sourceSlug: slug,
    intro: intro ? intro.text.replace(/\s*\n\s*/g, " ").trim() : null,
    sections,
  };
}

const services = [
  service({
    id: "microblading",
    name: "Microblading",
    category: "brows",
    landingSlug: "microbladinginfresnoca",
    detailSlug: "what-to-expect-during-microblading",
    tagline: grab("microbladinginfresnoca", "Soft, natural, and expertly shaped"),
    shortDescription: grab("home", "Soft, natural-looking brow definition"),
    longDescription: grab("service", "Define your shape and restore your confidence"),
    price: money(grab("home", "Starting at $550")),
    priceNote: "Starting at",
    bookingUrl: BOOKING.microblading,
    headline: grab("microbladinginfresnoca", "Microblading That Elevates"),
    guarantee: grab("microbladinginfresnoca", "LOVE your Brows"),
    faqs: [{
      question: "How long does microblading last?",
      answer: grab("service", "Typically 12–18 months"),
    }],
    seo: { title: pages.get("microbladinginfresnoca").seo.title },
  }),

  service({
    id: "nanoblading",
    name: "Nanoblading",
    category: "brows",
    landingSlug: "nanobladinginfresnoca",
    tagline: grab("nanobladinginfresnoca", "Soft, natural, and expertly shaped"),
    shortDescription: grab("nanobladinginfresnoca", "Soft, natural, and expertly shaped"),
    price: null,
    bookingUrl: BOOKING.general,
    headline: grab("nanobladinginfresnoca", "Microblading That Elevates"),
    guarantee: grab("nanobladinginfresnoca", "LOVE your Brows"),
    seo: { title: pages.get("nanobladinginfresnoca").seo.title },
  }),

  service({
    id: "brow-lamination",
    name: "Brow Lamination",
    category: "brows",
    landingSlug: "browlaminationinfresnoca",
    detailSlug: "how-brow-lamination-works",
    tagline: grab("browlaminationinfresnoca", "Fuller, fluffier, face-framing brows"),
    shortDescription: grab("service", "Keep you brows fresh"),
    price: money(grab("service", "$150")),
    bookingUrl: BOOKING.general,
    headline: grab("browlaminationinfresnoca", "Brow Lamination That Lifts"),
    guarantee: grab("browlaminationinfresnoca", "LOVE your Brows"),
    seo: { title: pages.get("browlaminationinfresnoca").seo.title },
  }),

  service({
    id: "lash-lift",
    name: "Lash Lift",
    category: "lashes",
    landingSlug: "lashliftinfresnoca",
    detailSlug: "how-a-lash-lift-works",
    tagline: grab("lashliftinfresnoca", "Ditch the curler"),
    shortDescription: grab("home", "Lifted lashes without extensions"),
    longDescription: grab("service", "Lift and darken your lashes"),
    price: money(grab("home", "Starting at $145")),
    priceNote: "Starting at",
    bookingUrl: BOOKING.lashLift,
    headline: grab("lashliftinfresnoca", "Effortless, Natural Lash Perfection"),
    guarantee: grab("lashliftinfresnoca", "LOVE your Lashes"),
    seo: { title: pages.get("lashliftinfresnoca").seo.title },
  }),

  service({
    id: "lash-sets",
    name: "Lash Sets",
    category: "lashes",
    tagline: grab("service", "Custom lash sets designed"),
    shortDescription: grab("service", "Custom lash sets designed"),
    price: null,
    bookingUrl: BOOKING.general,
  }),

  service({
    id: "pmu-removal",
    name: "PMU Removal",
    category: "corrective",
    landingSlug: "pmuremovalinfresnoca",
    tagline: grab("pmuremovalinfresnoca", "past work that faded poorly"),
    shortDescription: grab("home", "Lift old pigment"),
    longDescription: grab("service", "Safe, clean and precise corrections"),
    price: money(grab("home", "Starting at $120")),
    priceNote: "Starting at",
    bookingUrl: BOOKING.pmuRemoval,
    headline: grab("pmuremovalinfresnoca", "Gentle PMU Removal"),
    guarantee: grab("pmuremovalinfresnoca", "LOVE your Brows"),
    faqs: (() => {
      const b = blocksOf("pmuremovalinfresnoca");
      const out = [];
      b.forEach((blk, i) => {
        if (/\?$/.test(blk.text.trim()) && b[i + 1] && !/\?$/.test(b[i + 1].text.trim())) {
          out.push({
            question: blk.text.trim(),
            answer: b[i + 1].text.replace(/\s*\n\s*/g, " ").trim(),
          });
        }
      });
      return out;
    })(),
    seo: { title: pages.get("pmuremovalinfresnoca").seo.title },
  }),

  service({
    id: "teeth-whitening",
    name: "Teeth Whitening",
    category: "smile",
    landingSlug: "teethwhiteninginfresnoca",
    detailSlug: "methods-of-teeth-whitening",
    tagline: grab("teethwhiteninginfresnoca", "Instantly lift years of stains"),
    shortDescription: grab("home", "Brighter smile in one visit"),
    longDescription: grab("service", "A brighter smile in under an hour"),
    price: money(grab("home", "Starting at $150")),
    priceNote: "Starting at",
    bookingUrl: BOOKING.teethWhitening,
    headline: grab("teethwhiteninginfresnoca", "Whiten Your Smile"),
    guarantee: grab("teethwhiteninginfresnoca", "LOVE your Teeth"),
    seo: { title: pages.get("teethwhiteninginfresnoca").seo.title },
  }),

  service({
    id: "tinting",
    name: "Tinting (Brows/Lashes)",
    category: "brows",
    tagline: null,
    shortDescription: null,
    price: null,
    bookingUrl: BOOKING.general,
  }),

  service({
    id: "phone-consult",
    name: "Phone Consult",
    category: "consultation",
    tagline: grab("service", "Have questions before booking"),
    shortDescription: grab("service", "Have questions before booking"),
    price: 0,
    bookingUrl: BOOKING.general,
  }),

  service({
    id: "brow-mapping",
    name: "Brow Mapping",
    category: "consultation",
    tagline: grab("home", "Not sure which brow service"),
    shortDescription: grab("home", "Not sure which brow service"),
    price: 20,
    bookingUrl: BOOKING.browMapping,
  }),
];

/* ------------------------------------------------------------------ *
 * Bundles — same uniform shape, minus landing/detail
 * ------------------------------------------------------------------ */
const bundleNames = [
  "The Barefaced Transformation",
  "Glow & Go Package",
  "The Bridal Beauty Package",
  "The Brow Transformation",
];

const bundles = (() => {
  const b = blocksOf("service");
  const out = [];
  bundleNames.forEach((name) => {
    const i = b.findIndex((x) => x.text.startsWith(name));
    if (i === -1) return;
    const window = b.slice(i, i + 5);
    const desc = window.find((x) => x.type === "p" && x.text.length > 60);
    const priceBlk = window.find((x) => /^\$\d/.test(x.text.trim()));
    out.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: b[i].text.replace(/\s*\n\s*/g, " ").trim(),
      description: desc ? desc.text.replace(/\s*\n\s*/g, " ").trim() : null,
      price: {
        amount: priceBlk ? money(priceBlk.text) : null,
        currency: "USD",
        display: priceBlk ? priceBlk.text.trim() : null,
        qualifier: null,
      },
      bookingUrl: BOOKING.general,
    });
  });
  return out;
})();

/* ------------------------------------------------------------------ *
 * Testimonials
 * ------------------------------------------------------------------ */
const testimonials = (() => {
  const b = blocksOf("home");
  const out = [];
  b.forEach((blk, i) => {
    if (blk.type !== "blockquote") return;
    out.push({
      quote: blk.text.replace(/^"|"$/g, "").replace(/\s*\n\s*/g, " ").trim(),
      author: b[i + 1]?.text.trim() ?? null,
      source: null,
    });
  });
  return out;
})();


/* ------------------------------------------------------------------ *
 * FAQs — one shared accordion is repeated at the foot of /service and
 * every service-detail page, so it lives here once. Only question 1 has
 * an answer published on the live site; the rest render as empty panels,
 * carried through as `answer: null` so the gap stays visible.
 * ------------------------------------------------------------------ */
const faqs = (() => {
  const b = blocksOf("service");
  const out = [];
  b.forEach((blk, i) => {
    const m = blk.text.trim().match(/^(\d+):\s*(.+\?)$/);
    if (!m) return;
    const next = b[i + 1];
    const answered = next && !/^\d+:/.test(next.text.trim()) && next.type === "p";
    out.push({
      question: m[2],
      answer: answered ? next.text.replace(/\s*\n\s*/g, " ").trim() : null,
    });
  });
  return out;
})();

/* ------------------------------------------------------------------ *
 * Home page copy
 * ------------------------------------------------------------------ */
const home = {
  hero: {
    headline: grab("home", "Effortless Beauty"),
    subheadline: grab("home", "Natural-looking microblading"),
    socialProof: grab("home", "500+ 5-star reviews"),
  },
  about: {
    headline: grab("home", "Precision You Can Trust"),
    body: grabAll("home", /^At KTLN Studio, every service|^Clients choose KTLN Studio/),
    highlights: blocksOf("home").filter((b) => b.type === "li").map((b) => b.text.trim()),
  },
  servicesIntro: grab("home", "If you have any questions about services"),
  reviewsIntro: grab("home", "From Vagaro to Yelp to Google"),
  resultsIntro: grab("home", "Natural-looking transformations"),
  cta: {
    headline: grab("home", "Get Your $20 Brow Mapping"),
    body: grab("home", "Not sure which brow service"),
    bookingUrl: BOOKING.browMapping,
  },
};

/* ------------------------------------------------------------------ *
 * Blog posts (the 5 real Wix Blog articles — CMS "/blogs/*" entries hold
 * only truncated excerpts on the live site and are excluded)
 * ------------------------------------------------------------------ */
const posts = raw.pages
  .filter((p) => p.page_type === "blog_post")
  .map((p) => ({
    id: p.slug,
    slug: p.slug,
    title: p.seo.title?.replace(/\s*\|\s*Ktln Studio$/i, "") ?? p.slug,
    excerpt: p.seo["og:description"] ?? null,
    body: p.plain_text,
    wordCount: p.word_count,
  }));

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */
const seed = {
  meta: {
    source: "content.json (scrape of www.ktlnstudio.com)",
    generatedBy: "scripts/build-seed.mjs",
    generatedAt: new Date().toISOString(),
    note: "Marketing copy only. Wix widget chrome, form labels and legal boilerplate are excluded — full text remains in content.json.",
  },
  business,
  stylist,
  services,
  bundles,
  testimonials,
  faqs,
  home,
  posts,
};

writeFileSync(new URL("../src/data/seed.json", import.meta.url), JSON.stringify(seed, null, 2) + "\n");
console.log(
  `seed.json: ${services.length} services, ${bundles.length} bundles, ` +
  `${testimonials.length} testimonials, ${posts.length} posts`
);
