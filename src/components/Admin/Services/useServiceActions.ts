import { useCallback } from "react";
import { useSelector } from "react-redux";
import type { ServiceRecord } from "@/data/catalog";
import { useFirebase } from "@/firebase";
import { selectCatalogServices } from "@/redux";
import { toServiceFields, type ServiceDraft, type ServiceFields } from "./serviceDraft";

/** The slice of the Firebase class this hook uses. */
interface CatalogWriter {
    addCatalogService: (fields: ServiceFields) => Promise<void>;
    updateCatalogService: (id: string, fields: ServiceFields) => Promise<void>;
    deleteCatalogService: (id: string) => Promise<void>;
}

/**
 * Writes to the menu. There's no local copy to update afterwards: the
 * `catalog` listener (useCatalog) delivers every change back into the store,
 * and both the table and any open booking page re-render from there.
 */
export default function useServiceActions() {
    const firebase = useFirebase() as CatalogWriter | null;
    // Read for positions only: a new or moved service goes to the end of its category.
    const services: ServiceRecord[] = useSelector(selectCatalogServices);

    const saveService = useCallback(
        async (draft: ServiceDraft, editing: ServiceRecord | null) => {
            if (!firebase) throw new Error("Not connected to the database.");
            const fields = toServiceFields(draft, services, editing);
            if (editing) await firebase.updateCatalogService(editing.id, fields);
            else await firebase.addCatalogService(fields);
        },
        [firebase, services],
    );

    const removeService = useCallback(
        async (id: string) => {
            if (!firebase) throw new Error("Not connected to the database.");
            await firebase.deleteCatalogService(id);
        },
        [firebase],
    );

    return { saveService, removeService };
}
