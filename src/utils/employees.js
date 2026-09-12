/**
 * Resolving who a slot belongs to.
 *
 * `employeeId` is the only thing stored on a slot. Name and colour always come
 * from the live employee record, so a rename or a colour change applies to
 * every existing slot without rewriting slot data — and there is one source of
 * truth instead of copies on each slot that drift out of date.
 */

/** The employee with this id, or undefined if there isn't one (or no id). */
export function findEmployee(employees = [], id) {
  if (!id) return undefined;
  // TODO(deleted-employees): also search the deletedEmployees archive, so a
  // slot owned by someone since deleted still resolves. See EmployeeCrudManager.
  return employees.find((employee) => employee.id === id);
}

/** Slots owned by `employee`; every slot when no one is selected. */
export function slotsForEmployee(slots, employee) {
  if (!employee) return slots;
  return slots.filter((slot) => slot.employeeId === employee.id);
}

/** The owner's current colour, or `fallback` for unassigned or unknown owners. */
export function slotColor(slot, employees, fallback) {
  return findEmployee(employees, slot.employeeId)?.color ?? fallback;
}

export const UNASSIGNED_LABEL = "Unassigned";
export const REMOVED_OWNER_LABEL = "Removed professional";

/**
 * How to show the owner of a slot or booking. `missing` marks the two cases
 * with no live record — never assigned, or pointing at someone since deleted —
 * which the tables style differently so they stand out.
 * @returns {{ name: string, color: string | undefined, missing: boolean }}
 */
export function describeOwner(employees, id) {
  if (!id) return { name: UNASSIGNED_LABEL, color: undefined, missing: true };
  const employee = findEmployee(employees, id);
  if (!employee) return { name: REMOVED_OWNER_LABEL, color: undefined, missing: true };
  return { name: employee.name, color: employee.color, missing: false };
}

/** Values of the professional filter besides an employee id. */
export const ALL_PROFESSIONALS = "all";
export const UNASSIGNED = "unassigned";

/** Whether a row owned by `employeeId` passes the professional filter. */
export function matchesProfessional(employeeId, filter) {
  if (filter === ALL_PROFESSIONALS) return true;
  if (filter === UNASSIGNED) return !employeeId;
  return employeeId === filter;
}

/**
 * The filter to actually apply. A filter left on someone who has since been
 * deleted would silently hide every row, so it falls back to everyone.
 */
export function effectiveProfessionalFilter(filter, employees = []) {
  if (filter === ALL_PROFESSIONALS || filter === UNASSIGNED) return filter;
  return findEmployee(employees, filter) ? filter : ALL_PROFESSIONALS;
}
