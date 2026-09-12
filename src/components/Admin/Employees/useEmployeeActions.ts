import { useCallback } from "react";
import { useFirebase } from "@/firebase";
import { toEmployeeRecord, type EmployeeDraft } from "./employeeDraft";

type EmployeeRecord = ReturnType<typeof toEmployeeRecord>;

/** The slice of the Firebase class this hook uses. */
interface EmployeesWriter {
    addEmployee: (employee: EmployeeRecord) => Promise<void>;
    updateEmployee: (id: string, employee: EmployeeRecord) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
}

/**
 * Writes to the team. There's no local copy to update afterwards: the
 * `employees` listener (useEmployees) delivers every change back into the
 * store, and the table re-renders from there.
 */
export default function useEmployeeActions() {
    const firebase = useFirebase() as EmployeesWriter | null;

    const saveEmployee = useCallback(
        async (draft: EmployeeDraft, id: string | null) => {
            if (!firebase) throw new Error("Not connected to the database.");
            const record = toEmployeeRecord(draft);
            if (id) await firebase.updateEmployee(id, record);
            else await firebase.addEmployee(record);
        },
        [firebase],
    );

    const removeEmployee = useCallback(
        async (id: string) => {
            if (!firebase) throw new Error("Not connected to the database.");
            // TODO(deleted-employees): archive instead of hard-deleting — see
            // the note in EmployeeCrudManager. Until then the confirm dialog
            // spells out what the person still has on the calendar.
            await firebase.deleteEmployee(id);
        },
        [firebase],
    );

    return { saveEmployee, removeEmployee };
}
