import { useCallback, useEffect, useState } from "react";
import { useFirebase } from "@/firebase";
import { normalizeFreeSlots, type OpenSlot } from "./freeSlots";

/** The slice of the Firebase class this hook uses. */
interface FreeSlotsSource {
    freeAppointments: () => unknown;
    doOnValue: (reference: unknown, callback: (snapshot: { val: () => unknown }) => void) => () => void;
    deleteEventsForSure: (slots: { eventKey: string }[]) => Promise<void>;
}

/**
 * Live list of open slots, plus deleting a batch of them in one atomic write.
 * Unsubscribes through `onValue`'s own return — see useBookedAppointments.
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

    return { slots, loading, deleteSlots };
}
