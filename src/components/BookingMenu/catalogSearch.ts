import type { CatalogGroup, CatalogService } from "@/data";

/** Case- and whitespace-insensitive: "LASH lift" finds "Lash Lift". */
const normalize = (text: string) => text.trim().toLowerCase();

/** Every service a group offers, including its add-ons and subcategories. */
export function countServices(group: CatalogGroup): number {
    return (
        (group.services?.length ?? 0) +
        (group.addOns?.length ?? 0) +
        (group.subcategories ?? []).reduce((total, sub) => total + countServices(sub), 0)
    );
}

function matches(service: CatalogService, query: string): boolean {
    return normalize(service.name).includes(query);
}

function filterGroup(group: CatalogGroup, query: string): CatalogGroup | null {
    // A group whose own name matches keeps everything under it — searching
    // "lash" should open the whole lash menu, not just rows with "lash" in them.
    if (normalize(group.name).includes(query)) return group;

    const services = (group.services ?? []).filter((service) => matches(service, query));
    const addOns = (group.addOns ?? []).filter((service) => matches(service, query));
    const subcategories = (group.subcategories ?? [])
        .map((sub) => filterGroup(sub, query))
        .filter((sub): sub is CatalogGroup => sub !== null);

    if (services.length === 0 && addOns.length === 0 && subcategories.length === 0) return null;
    return { ...group, services, addOns, subcategories };
}

/** The menu narrowed to what matches; an empty query returns it untouched. */
export function filterCatalog(categories: CatalogGroup[], query: string): CatalogGroup[] {
    const normalized = normalize(query);
    if (!normalized) return categories;
    return categories
        .map((category) => filterGroup(category, normalized))
        .filter((category): category is CatalogGroup => category !== null);
}

/** Total services across the filtered menu — the "N results" line. */
export function countMatches(categories: CatalogGroup[]): number {
    return categories.reduce((total, category) => total + countServices(category), 0);
}
