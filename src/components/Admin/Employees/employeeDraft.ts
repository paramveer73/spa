import type { Employee } from "@/components/calendar";
import { timeStatus } from "@/utils/timeframe";
import type { Booking } from "../Bookings/bookings";
import type { OpenSlot } from "../FreeSlots/freeSlots";

/**
 * Rules for the add/edit professional form, and the per-person workload the
 * team table shows. Kept out of the dialog so the dialog only renders.
 */

/** An employee record as the admin sees it — `role` isn't needed by the calendar. */
export interface StaffMember extends Employee {
    role?: string;
}

/** What the form edits. Strings throughout, so inputs stay controlled. */
export interface EmployeeDraft {
    name: string;
    role: string;
    color: string;
}

export interface DraftCheck {
    nameError?: string;
    nameWarning?: string;
    colorError?: string;
    colorWarning?: string;
    /** Errors block saving; warnings only flag something worth a second look. */
    canSave: boolean;
}

export interface Workload {
    openSlots: number;
    upcomingBookings: number;
}

export const DEFAULT_ROLE = "Professional";
export const NAME_MAX = 40;

/**
 * Colours that stay distinct from each other and hold white text on the
 * calendar. New professionals get the first one nobody uses yet.
 */
export const TEAM_PALETTE = [
    "#8e5ea2",
    "#c2185b",
    "#d9822b",
    "#2e7d6f",
    "#3f6fb5",
    "#6d8b3a",
    "#b85c5c",
    "#5c6bc0",
    "#00838f",
    "#7b5e3b",
] as const;

const tidyName = (name: string) => name.trim().replace(/\s+/g, " ");
const sameName = (a: string, b: string) => tidyName(a).toLowerCase() === tidyName(b).toLowerCase();

/** `#abc` or `#aabbcc` in any case → `#aabbcc`; anything else → null. */
export function normalizeHex(color: string): string | null {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
    if (!match) return null;
    const hex = match[1].toLowerCase();
    return hex.length === 3 ? `#${[...hex].map((c) => c + c).join("")}` : `#${hex}`;
}

/** The first palette colour no one has; the first colour when all are taken. */
export function suggestColor(employees: StaffMember[]): string {
    const used = new Set(employees.map((employee) => normalizeHex(employee.color ?? "")));
    return TEAM_PALETTE.find((color) => !used.has(color)) ?? TEAM_PALETTE[0];
}

/** Who already uses this colour, keyed by normalised hex — for the swatch tooltips. */
export function colourOwners(employees: StaffMember[]): Map<string, StaffMember> {
    const owners = new Map<string, StaffMember>();
    for (const employee of employees) {
        const hex = normalizeHex(employee.color ?? "");
        if (hex && !owners.has(hex)) owners.set(hex, employee);
    }
    return owners;
}

export function draftFromEmployee(employee: StaffMember | null, employees: StaffMember[]): EmployeeDraft {
    if (!employee) return { name: "", role: DEFAULT_ROLE, color: suggestColor(employees) };
    return {
        name: employee.name,
        role: employee.role || DEFAULT_ROLE,
        color: normalizeHex(employee.color ?? "") ?? suggestColor(employees),
    };
}

/**
 * Validates a draft against the rest of the team. `editingId` is the record
 * being edited, so a professional never conflicts with themselves.
 */
export function checkEmployeeDraft(
    draft: EmployeeDraft,
    employees: StaffMember[],
    editingId: string | null,
): DraftCheck {
    const others = employees.filter((employee) => employee.id !== editingId);
    const check: DraftCheck = { canSave: true };

    const name = tidyName(draft.name);
    if (!name) check.nameError = "Enter a name.";
    else if (name.length > NAME_MAX) check.nameError = `Keep it to ${NAME_MAX} characters.`;
    else {
        const twin = others.find((employee) => sameName(employee.name, name));
        if (twin) {
            check.nameWarning = `${twin.name} is already on the team. Clients choose by name, so add an initial to tell them apart.`;
        }
    }

    const color = normalizeHex(draft.color);
    if (!color) check.colorError = "Pick a colour.";
    else {
        const twin = others.find((employee) => normalizeHex(employee.color ?? "") === color);
        if (twin) check.colorWarning = `${twin.name} uses this colour too, so their slots would look the same on the calendar.`;
    }

    check.canSave = !check.nameError && !check.colorError;
    return check;
}

/** Whether saving would change anything — Save stays disabled until it would. */
export function isDraftChanged(draft: EmployeeDraft, employee: StaffMember | null): boolean {
    if (!employee) return true;
    return (
        tidyName(draft.name) !== employee.name ||
        (draft.role.trim() || DEFAULT_ROLE) !== (employee.role || DEFAULT_ROLE) ||
        normalizeHex(draft.color) !== normalizeHex(employee.color ?? "")
    );
}

/** The record written to Firebase. Call only when `checkEmployeeDraft` allows saving. */
export function toEmployeeRecord(draft: EmployeeDraft) {
    return {
        name: tidyName(draft.name),
        role: draft.role.trim() || DEFAULT_ROLE,
        color: normalizeHex(draft.color) ?? TEAM_PALETTE[0],
    };
}

/** Upcoming open slots and bookings per employee id — what deleting someone would strand. */
export function workloadByEmployee(slots: OpenSlot[], bookings: Booking[], now: Date): Map<string, Workload> {
    const workload = new Map<string, Workload>();
    const entry = (id: string) => {
        let current = workload.get(id);
        if (!current) {
            current = { openSlots: 0, upcomingBookings: 0 };
            workload.set(id, current);
        }
        return current;
    };
    for (const slot of slots) {
        if (slot.employeeId && timeStatus(slot.start, slot.end, now) !== "past") entry(slot.employeeId).openSlots += 1;
    }
    for (const booking of bookings) {
        if (booking.employeeId && timeStatus(booking.start, booking.end, now) !== "past") {
            entry(booking.employeeId).upcomingBookings += 1;
        }
    }
    return workload;
}
