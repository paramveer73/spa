import type { BookingPolicies, CatalogService } from "@/data";

/**
 * What a picked service looks like in the store. It carries its own price and
 * duration rather than an id alone: a price change months later must not
 * silently rewrite what someone already has in their cart.
 */
export interface CartLine {
  id: string;
  name: string;
  price: number;
  duration: number;
  /** Which part of the menu it came from, for grouping the summary. */
  categoryName: string;
}

export interface CartTotals {
  count: number;
  price: number;
  duration: number;
}

export function toCartLine(service: CatalogService, categoryName: string): CartLine {
  return {
    id: service.id,
    name: service.name,
    price: service.price,
    duration: service.duration,
    categoryName,
  };
}

export function cartTotals(lines: CartLine[]): CartTotals {
  return lines.reduce(
    (totals, line) => ({
      count: totals.count + 1,
      price: totals.price + (line.price || 0),
      duration: totals.duration + (line.duration || 0),
    }),
    { count: 0, price: 0, duration: 0 }
  );
}

/** The deposit on a total, rounded to whole dollars — one rule for every screen that quotes it. */
export function depositFor(total: number, policies: BookingPolicies): number {
  return Math.round((total * policies.deposit_percent) / 100);
}

/**
 * The cart at today's prices. Lines keep the price they were added at, but
 * the server charges the catalog's current one — so the confirm step shows
 * and sends these. `missing` are lines whose service has left the menu.
 */
export function repriceCart(lines: CartLine[], services: CatalogService[]): { lines: CartLine[]; missing: CartLine[] } {
  const byId = new Map(services.map((service) => [service.id, service]));
  const current: CartLine[] = [];
  const missing: CartLine[] = [];
  for (const line of lines) {
    const service = byId.get(line.id);
    if (service) current.push({ ...line, name: service.name, price: service.price, duration: service.duration });
    else missing.push(line);
  }
  return { lines: current, missing };
}
