import { useCallback, useEffect, useState } from "react";
import { callApi, errorMessage, type TokenSource } from "@/api/apiClient";
import { useFirebase } from "@/firebase";

/** A saved card as the API returns it — what the page may show, nothing more. */
export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

interface TokenHolder {
  getIdToken: TokenSource;
}

/**
 * The signed-in client's cards on file, through the functions' /cards
 * routes. Loads on mount; every change refetches, so the list always matches
 * Stripe rather than a local guess of it.
 */
export default function useCards() {
  const firebase = useFirebase() as TokenHolder | null;
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getIdToken = useCallback<TokenSource>(() => (firebase ? firebase.getIdToken() : Promise.resolve(null)), [firebase]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await callApi<{ cards: SavedCard[] }>(getIdToken, "/cards");
      setCards(data.cards);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** A SetupIntent client secret; Stripe.js then collects the card straight to Stripe against it. */
  const startAdding = useCallback(async () => {
    const { data } = await callApi<{ clientSecret: string }>(getIdToken, "/cards/setup-intent", { method: "POST" });
    return data.clientSecret;
  }, [getIdToken]);

  const removeCard = useCallback(
    async (id: string) => {
      await callApi(getIdToken, `/cards/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
    },
    [getIdToken, refresh],
  );

  const makeDefault = useCallback(
    async (id: string) => {
      await callApi(getIdToken, `/cards/${encodeURIComponent(id)}`, { method: "PATCH", body: { makeDefault: true } });
      await refresh();
    },
    [getIdToken, refresh],
  );

  return { cards, loading, error, refresh, startAdding, removeCard, makeDefault };
}
