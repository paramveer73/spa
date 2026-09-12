import { useSelector } from "react-redux";
import type { Employee } from "@/components/calendar";
import FreeSlotsTable, { useFreeSlots } from "@/components/Admin/FreeSlots";
import { selectEmployees } from "@/redux";

/** The Open slots tab: every bookable slot, live, for bulk tidying. */
export default function AdminSlotsPage() {
  const employees: Employee[] = useSelector(selectEmployees);
  const { slots, loading, deleteSlots } = useFreeSlots();

  return <FreeSlotsTable slots={slots} employees={employees} loading={loading} onDeleteSlots={deleteSlots} />;
}
