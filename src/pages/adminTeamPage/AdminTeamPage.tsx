import { useSelector } from "react-redux";
import { useBookedAppointments } from "@/components/Admin/Bookings";
import EmployeesTable, { useEmployeeActions, type StaffMember } from "@/components/Admin/Employees";
import { useFreeSlots } from "@/components/Admin/FreeSlots";
import { selectEmployees } from "@/redux";

/**
 * The Team tab. Slots and bookings are subscribed here only to count what
 * each professional has coming up — the numbers the delete warning quotes.
 */
export default function AdminTeamPage() {
  const employees: StaffMember[] = useSelector(selectEmployees);
  const { slots } = useFreeSlots();
  const { bookings } = useBookedAppointments();
  const { saveEmployee, removeEmployee } = useEmployeeActions();

  return (
    <EmployeesTable
      employees={employees}
      slots={slots}
      bookings={bookings}
      onSaveEmployee={saveEmployee}
      onDeleteEmployee={removeEmployee}
    />
  );
}
