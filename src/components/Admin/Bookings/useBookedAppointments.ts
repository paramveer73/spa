import { useCallback, useEffect, useState } from "react";
import { useFirebase } from "@/firebase";
import { cancellationKeys, normalizeBookings, type Booking } from "./bookings";

/** The slice of the Firebase class this hook uses. */
interface BookingsSource {
    bookedAppointments: () => unknown;
    doOnValue: (reference: unknown, callback: (snapshot: { val: () => unknown }) => void) => () => void;
    deleteBookedAppointment: (keys: { eventKey: string; bookedAppointmentKey: string }) => Promise<void>;
}

/**
 * Live list of booked appointments, plus cancelling one.
 *
 * Unsubscribes with the function `onValue` returns rather than `doOff(ref)`:
 * `off` drops *every* listener on the path, which would silently kill the
 * other subscriber when two screens read bookings at once.
 */
export default function useBookedAppointments() {
    const firebase = useFirebase() as BookingsSource | null;
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebase) return undefined;
        return firebase.doOnValue(firebase.bookedAppointments(), (snapshot) => {
            setBookings(normalizeBookings(snapshot.val()));
            setLoading(false);
        });
    }, [firebase]);

    const cancelBooking = useCallback(
        async (booking: Booking) => {
            if (!firebase) throw new Error("Not connected to the database.");
            await firebase.deleteBookedAppointment(cancellationKeys(booking));
        },
        [firebase],
    );

    return { bookings, loading, cancelBooking };
}
