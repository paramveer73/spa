import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { normalizeCatalog } from "@/data/catalog";
import { useFirebase } from "@/firebase";
import { setCatalog } from "@/redux";

interface CatalogSource {
  onCatalogUpdate: (callback: (raw: unknown) => void) => () => void;
}

/**
 * Keeps the menu in the store in step with the database's `catalog` node.
 * Run by each page that shows or edits the menu — the booking page and the
 * admin Services screen — so a price changed in the admin reaches an open
 * booking page without a reload.
 */
export default function useCatalog() {
  const firebase = useFirebase() as CatalogSource | null;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!firebase) return undefined;
    return firebase.onCatalogUpdate((raw) => dispatch(setCatalog(normalizeCatalog(raw))));
  }, [firebase, dispatch]);
}
