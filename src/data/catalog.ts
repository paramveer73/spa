/**
 * The bookable menu, as stored in the database under `catalog/`:
 *
 *   catalog/policies                { deposit_percent, deposit_refundable, … }
 *   catalog/categories/{id}         { name, order, parentId? }
 *   catalog/services/{id}           { name, price, duration, categoryId, order, addOn?, note? }
 *
 * Flat rather than nested: the admin edits one service at a time, and a
 * service is then one node to update — not an index into an array inside a
 * category inside a category. The nested menu the booking page renders is
 * rebuilt from these by `buildMenu`. `order` keeps the studio's sequence,
 * since the database returns children sorted by key.
 *
 * Separate from `services` in seed.json — that one is the marketing copy for
 * the four headline treatments. This is the full price list the booking flow
 * charges against. It was first seeded from the studio's Vagaro export by
 * scripts/build-catalog-import.mjs.
 */

export interface CatalogService {
  id: string;
  name: string;
  price: number;
  /** Minutes in the chair, used for the running total and the slot-length filter. */
  duration: number;
  /**
   * Internal note ("confirm with Kate…"), never customer copy — deliberately
   * not rendered on the booking page.
   */
  note?: string;
}

export interface CatalogGroup {
  id: string;
  name: string;
  services?: CatalogService[];
  subcategories?: CatalogGroup[];
  /** Extras offered alongside that group's services rather than on their own. */
  addOns?: CatalogService[];
}

export interface BookingPolicies {
  deposit_percent: number;
  deposit_refundable: boolean;
  late_cancellation_fee_percent: number;
  late_cancellation_window_hours: number;
  no_show_fee_flat: number;
  no_show_fee_default_percent: number;
}

/** A service as stored at `catalog/services/{id}`, with its key as `id`. */
export interface ServiceRecord extends CatalogService {
  categoryId: string;
  order: number;
  /** Listed under its category's add-ons rather than its services. */
  addOn: boolean;
}

/** A category as stored at `catalog/categories/{id}`. Subcategories name their parent. */
export interface CategoryRecord {
  id: string;
  name: string;
  order: number;
  parentId: string | null;
}

export interface Catalog {
  categories: CategoryRecord[];
  services: ServiceRecord[];
  /** Null until the policies node exists — the deposit line hides rather than guessing a percentage. */
  policies: BookingPolicies | null;
}

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

// Tolerates numbers typed into the console as strings ("650"); anything that
// still isn't a finite number is treated as missing.
function toNumber(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

const byOrder = <T extends { order: number; name: string }>(a: T, b: T) =>
  a.order - b.order || a.name.localeCompare(b.name);

function toCategory(id: string, raw: unknown): CategoryRecord | null {
  if (!isRecord(raw) || !text(raw.name)) return null;
  return { id, name: text(raw.name), order: toNumber(raw.order) ?? 0, parentId: text(raw.parentId) || null };
}

function toService(id: string, raw: unknown): ServiceRecord | null {
  if (!isRecord(raw)) return null;
  const name = text(raw.name);
  const price = toNumber(raw.price);
  const duration = toNumber(raw.duration);
  // Without a name, price or length a service can't be shown or charged, so
  // it's left out rather than listed as "$0 · 0 min".
  if (!name || price === null || duration === null) return null;
  const note = text(raw.note);
  return {
    id,
    name,
    price,
    duration,
    categoryId: text(raw.categoryId),
    order: toNumber(raw.order) ?? 0,
    addOn: raw.addOn === true,
    ...(note ? { note } : {}),
  };
}

function toPolicies(raw: unknown): BookingPolicies | null {
  if (!isRecord(raw)) return null;
  const deposit = toNumber(raw.deposit_percent);
  if (deposit === null) return null;
  return {
    deposit_percent: deposit,
    deposit_refundable: raw.deposit_refundable === true,
    late_cancellation_fee_percent: toNumber(raw.late_cancellation_fee_percent) ?? 0,
    late_cancellation_window_hours: toNumber(raw.late_cancellation_window_hours) ?? 0,
    no_show_fee_flat: toNumber(raw.no_show_fee_flat) ?? 0,
    no_show_fee_default_percent: toNumber(raw.no_show_fee_default_percent) ?? 0,
  };
}

function records<T>(raw: unknown, read: (id: string, value: unknown) => T | null): T[] {
  if (!isRecord(raw)) return [];
  return Object.entries(raw)
    .map(([id, value]) => read(id, value))
    .filter((record): record is T => record !== null);
}

/** The `catalog` node as the database returns it → flat, typed, in menu order. */
export function normalizeCatalog(raw: unknown): Catalog {
  const node = isRecord(raw) ? raw : {};
  return {
    categories: records(node.categories, toCategory).sort(byOrder),
    services: records(node.services, toService).sort(byOrder),
    policies: toPolicies(node.policies),
  };
}

/**
 * The nested menu the booking page renders. A subcategory whose parent is
 * gone is promoted to the top level; a service whose category is gone is
 * left off the menu — the admin table still lists it, flagged, so it can be
 * moved.
 */
export function buildMenu({ categories, services }: Pick<Catalog, "categories" | "services">): CatalogGroup[] {
  const ids = new Set(categories.map((category) => category.id));
  const childrenOf = (parentId: string | null) =>
    categories.filter((category) =>
      parentId === null ? !category.parentId || !ids.has(category.parentId) : category.parentId === parentId,
    );

  const toGroup = (category: CategoryRecord): CatalogGroup => {
    const own = services.filter((service) => service.categoryId === category.id);
    return {
      id: category.id,
      name: category.name,
      services: own.filter((service) => !service.addOn),
      addOns: own.filter((service) => service.addOn),
      // One level deep, as the studio's menu is — deeper nesting isn't offered by the admin form.
      subcategories: category.parentId && ids.has(category.parentId) ? [] : childrenOf(category.id).map(toGroup),
    };
  };

  return childrenOf(null).map(toGroup);
}

/**
 * Categories in menu order, subcategories straight after their parent, each
 * labelled with its path ("Lash Extensions › Classic Lashes") — for the admin
 * table's category column and the form's category picker.
 */
export function categoryPaths(categories: CategoryRecord[]): { id: string; label: string; depth: number }[] {
  const ids = new Set(categories.map((category) => category.id));
  const tops = categories.filter((category) => !category.parentId || !ids.has(category.parentId));
  return tops.flatMap((top) => [
    { id: top.id, label: top.name, depth: 0 },
    ...categories
      .filter((category) => category.parentId === top.id)
      .map((sub) => ({ id: sub.id, label: `${top.name} › ${sub.name}`, depth: 1 })),
  ]);
}
