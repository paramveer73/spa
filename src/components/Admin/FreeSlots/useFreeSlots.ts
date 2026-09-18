import { useCallback, useEffect, useState } from "react";
import { useFirebase } from "@/firebase";
import { normalizeFreeSlots, openOnly, type OpenSlot } from "./freeSlots";

/** The slice of the Firebase class this hook uses. */
interface FreeSlotsSource {
    freeAppointments: () => unknown;
    doOnValue: (reference: unknown, callback: (snapshot: { val: () => unknown }) => void) => () => void;
    deleteEventsForSure: (slots: { eventKey: string }[]) => Promise<void>;
}

/**
 * Live slot list, plus deleting a batch of them in one atomic write.
 *
 * Returns both cuts of the same subscription: `slots` is everything the
 * schedule calendar draws (booked-in-place included) and `openSlots` is what a
 * client could still book. Unsubscribes through `onValue`'s own return — see
 * useBookedAppointments.
 */
export default function useFreeSlots() {
    const firebase = useFirebase() as FreeSlotsSource | null;
    const [slots, setSlots] = useState<OpenSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebase) return undefined;
        return firebase.doOnValue(firebase.freeAppointments(), (snapshot) => {
            setSlots(normalizeFreeSlots(snapshot.val()));
            setLoading(false);
        });
    }, [firebase]);

    const deleteSlots = useCallback(
        async (toDelete: OpenSlot[]) => {
            if (!firebase) throw new Error("Not connected to the database.");
            if (toDelete.length === 0) return;
            await firebase.deleteEventsForSure(toDelete.map(({ eventKey }) => ({ eventKey })));
        },
        [firebase],
    );

    return { slots, openSlots: openOnly(slots), loading, deleteSlots };
}
