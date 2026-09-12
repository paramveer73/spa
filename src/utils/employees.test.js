/**
 * employeeId is the only thing that identifies who a slot belongs to. Name
 * and colour are always read from the live employee record, never from the
 * slot — so renames and colour changes apply to existing slots for free.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { findEmployee, slotColor, slotsForEmployee } from "./employees.js";

const FALLBACK = "#3174ad";

test("T24 filtering by a renamed professional still finds their slots", () => {
  const renamed = { id: "k1", name: "Katelyn Nguyen", color: "#b08968" };
  const slots = [
    // Written before the rename: the stale name in `extra` must not matter.
    { eventKey: "a", employeeId: "k1", extra: { employee: "Katelyn" } },
    { eventKey: "b", employeeId: "m2" },
  ];
  assert.deepEqual(slotsForEmployee(slots, renamed).map((s) => s.eventKey), ["a"]);
});

test("no professional selected means every slot", () => {
  const slots = [{ employeeId: "k1" }, { employeeId: "m2" }, {}];
  assert.equal(slotsForEmployee(slots, null).length, 3);
});

test("T25 changing a professional's colour recolours their slots without touching slot data", () => {
  const slot = { eventKey: "a", employeeId: "k1", extra: { employeeColor: "#000000" } };
  const before = structuredClone(slot);

  assert.equal(slotColor(slot, [{ id: "k1", color: "#b08968" }], FALLBACK), "#b08968");
  assert.equal(slotColor(slot, [{ id: "k1", color: "#5c4634" }], FALLBACK), "#5c4634");
  assert.deepEqual(slot, before);
});

test("T27 a slot with no owner, or an unknown owner, degrades instead of throwing", () => {
  const employees = [{ id: "k1", color: "#b08968" }];
  for (const slot of [{}, { employeeId: undefined }, { employeeId: "gone" }]) {
    assert.equal(slotColor(slot, employees, FALLBACK), FALLBACK);
    assert.equal(findEmployee(employees, slot.employeeId), undefined);
    assert.equal(slotsForEmployee([slot], employees[0]).length, 0);
  }
});

test("T28 a deleted professional still resolves from the deletedEmployees archive", {
  todo: "archive employees on delete — see TODO(deleted-employees) in EmployeeCrudManager.tsx",
});
