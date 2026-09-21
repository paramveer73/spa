import type { CategoryRecord, ServiceRecord } from "@/data/catalog";

/**
 * Rules for the add/edit service form. Kept out of the dialog so the dialog
 * only renders, and so the record written to the database is decided in one
 * place.
 */

/** What the form edits. Strings for the number fields, so inputs stay controlled while typing. */
export interface ServiceDraft {
    name: string;
    categoryId: string;
    price: string;
    duration: string;
    addOn: boolean;
    note: string;
}

export interface ServiceDraftCheck {
    nameError?: string;
    nameWarning?: string;
    categoryError?: string;
    priceError?: string;
    durationError?: string;
    /** Errors block saving; warnings only flag something worth a second look. */
    canSave: boolean;
}

/** The fields written to `catalog/services/{id}`; null removes a field. */
export interface ServiceFields {
    name: string;
    categoryId: string;
    price: number;
    duration: number;
    order?: number;
    addOn: true | null;
    note: string | null;
}

export const NAME_MAX = 80;
export const PRICE_MAX = 10000;
export const DURATION_MIN = 5;
export const DURATION_MAX = 600;
export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const tidy = (value: string) => value.trim().replace(/\s+/g, " ");
const sameName = (a: string, b: string) => tidy(a).toLowerCase() === tidy(b).toLowerCase();

// Dollars with at most cents. Stricter than Number(): "1e3" and "12." are
// valid numbers but aren't what anyone meant to type as a price.
const PRICE_SHAPE = /^\d+(\.\d{1,2})?$/;

export function draftFromService(service: ServiceRecord | null, defaultCategoryId: string): ServiceDraft {
    if (!service) return { name: "", categoryId: defaultCategoryId, price: "", duration: "60", addOn: false, note: "" };
    return {
        name: service.name,
        categoryId: service.categoryId,
        price: String(service.price),
        duration: String(service.duration),
        addOn: service.addOn,
        note: service.note ?? "",
    };
}

/** Validates a draft. `editingId` is the service being edited, so it never clashes with itself. */
export function checkServiceDraft(
    draft: ServiceDraft,
    services: ServiceRecord[],
    categories: CategoryRecord[],
    editingId: string | null,
): ServiceDraftCheck {
    const check: ServiceDraftCheck = { canSave: true };

    const name = tidy(draft.name);
    if (!name) check.nameError = "Enter a name.";
    else if (name.length > NAME_MAX) check.nameError = `Keep it to ${NAME_MAX} characters.`;
    else {
        const twin = services.find(
            (service) => service.id !== editingId && service.categoryId === draft.categoryId && sameName(service.name, name),
        );
        if (twin) check.nameWarning = "This category already has a service with that name. Clients would see it twice.";
    }

    if (!categories.some((category) => category.id === draft.categoryId)) check.categoryError = "Pick a category.";

    const price = draft.price.trim();
    if (!price) check.priceError = "Enter a price.";
    else if (!PRICE_SHAPE.test(price)) check.priceError = "Dollars and cents only, like 120 or 89.50.";
    else if (Number(price) > PRICE_MAX) check.priceError = `Prices go up to $${PRICE_MAX.toLocaleString("en-US")}.`;

    const duration = Number(draft.duration);
    if (!Number.isInteger(duration) || duration < DURATION_MIN || duration > DURATION_MAX) {
        check.durationError = `Whole minutes, ${DURATION_MIN} to ${DURATION_MAX}.`;
    }

    check.canSave = !check.nameError && !check.categoryError && !check.priceError && !check.durationError;
    return check;
}

/** Whether saving would change anything — Save stays disabled until it would. */
export function isDraftChanged(draft: ServiceDraft, service: ServiceRecord | null): boolean {
    if (!service) return true;
    return (
        tidy(draft.name) !== service.name ||
        draft.categoryId !== service.categoryId ||
        Number(draft.price) !== service.price ||
        Number(draft.duration) !== service.duration ||
        draft.addOn !== service.addOn ||
        draft.note.trim() !== (service.note ?? "")
    );
}

/** One past the last position in a category, so a new or moved service lands at the end of it. */
function nextOrder(services: ServiceRecord[], categoryId: string): number {
    const inCategory = services.filter((service) => service.categoryId === categoryId);
    return inCategory.reduce((highest, service) => Math.max(highest, service.order + 1), 0);
}

/**
 * The fields to write. Call only when `checkServiceDraft` allows saving.
 * `order` is set only when the service is new or changes category — an edit
 * in place keeps its spot on the menu.
 */
export function toServiceFields(draft: ServiceDraft, services: ServiceRecord[], editing: ServiceRecord | null): ServiceFields {
    const movesCategory = !editing || editing.categoryId !== draft.categoryId;
    return {
        name: tidy(draft.name),
        categoryId: draft.categoryId,
        price: Number(draft.price.trim()),
        duration: Number(draft.duration),
        ...(movesCategory ? { order: nextOrder(services, draft.categoryId) } : {}),
        addOn: draft.addOn ? true : null,
        note: draft.note.trim() || null,
    };
}
