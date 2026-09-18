import catalog from "./ktln_services.json";

/**
 * The bookable menu, straight from the studio's Vagaro export: nine
 * categories, some split into subcategories, a few carrying their own add-ons.
 *
 * Separate from `services` in seed.json — that one is the marketing copy for
 * the four headline treatments (taglines, FAQs, long descriptions). This is the
 * full price list the booking flow charges against.
 */

export interface CatalogService {
  id: string;
  name: string;
  price: number;
  /** Minutes in the chair, used for the running total and later for slot fit. */
  duration: number;
  /**
   * Internal QA note from the export ("confirm with Kate…"), never customer
   * copy — deliberately not rendered anywhere on the public page.
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

const data = catalog as unknown as {
  categories: CatalogGroup[];
  policies: BookingPolicies & { raw_policy_line_items?: unknown[] };
};

export const serviceCategories = data.categories;
export const bookingPolicies = data.policies;

/** Every service in the tree, flattened — groups nest one level deep today. */
function collect(group: CatalogGroup): CatalogService[] {
  return [
    ...(group.services ?? []),
    ...(group.addOns ?? []),
    ...(group.subcategories ?? []).flatMap(collect),
  ];
}

export const catalogServices: CatalogService[] = serviceCategories.flatMap(collect);

const byId = new Map(catalogServices.map((service) => [service.id, service]));

/** The service behind a cart line, or undefined if the menu no longer has it. */
export function findCatalogService(id: string): CatalogService | undefined {
  return byId.get(id);
}
