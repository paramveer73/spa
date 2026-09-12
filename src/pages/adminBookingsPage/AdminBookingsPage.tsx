import { useSelector } from "react-redux";
import BookingsTable, { useBookedAppointments } from "@/components/Admin/Bookings";
import type { Employee } from "@/components/calendar";
import { selectEmployees } from "@/redux";

/** The Bookings tab: every booked appointment, live. */
export default function AdminBookingsPage() {
  const employees: Employee[] = useSelector(selectEmployees);
  const { bookings, loading, cancelBooking } = useBookedAppointments();

  return (
    <BookingsTable bookings={bookings} employees={employees} loading={loading} onCancelBooking={cancelBooking} />
  );
}
