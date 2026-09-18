import type { CatalogService } from "@/data";

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
