import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ApiError, callApi, errorMessage, type TokenSource } from "@/api/apiClient";
import { stripePromise } from "@/api/stripe";
import { useFirebase } from "@/firebase";
import { resetAppointment } from "@/redux";

/** What the server needs to book — ids and the client's own details; it prices everything itself. */
export interface CheckoutRequest {
  serviceIds: string[];
  eventKeys: string[];
  paymentMethodId: string;
  /** The retainer the client saw and agreed to; the server refuses if its own figure differs. */
  retainerAmount: number;
  retainerAccepted: boolean;
  contact: { name: string; phone: string; note: string };
}

export interface CheckoutError {
  message: string;
  /** The time went to someone else — worth offering "pick another time". */
  slotUnavailable: boolean;
}

interface CheckoutReply {
  status: string;
  orderId: string;
  clientSecret?: string;
  bookedAppointmentKey?: string;
}

interface TokenHolder {
  getIdToken: TokenSource;
}

// Mirrors the server's ORDER_STATUS / ERROR_CODE values this page acts on.
const REQUIRES_ACTION = "requires_action";
const SLOT_UNAVAILABLE = "slot_unavailable";

// 202 means another request (usually Stripe's webhook) is finishing the same
// booking; asking again shortly gets the outcome.
const POLL_ATTEMPTS = 6;
const POLL_DELAY_MS = 1500;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Books with the retainer: POST /checkout, then — only if the bank asks —
 * 3-D Secure in Stripe's modal and POST /checkout/:id/complete. Clears the
 * cart on success.
 */
export default function useCheckout() {
  const firebase = useFirebase() as TokenHolder | null;
  const dispatch = useDispatch();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);
  // One id per attempt. Kept when a request got no answer at all: the charge
  // may have gone through, and resending the same id makes the server report
  // that attempt rather than charge a second time.
  const orderIdRef = useRef<string | null>(null);

  const getIdToken = useCallback<TokenSource>(() => (firebase ? firebase.getIdToken() : Promise.resolve(null)), [firebase]);

  const complete = useCallback(
    async (orderId: string) => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        const reply = await callApi<CheckoutReply>(getIdToken, `/checkout/${orderId}/complete`, { method: "POST" });
        if (reply.status !== 202) return reply;
        await wait(POLL_DELAY_MS);
      }
      throw new ApiError(0, "Your booking is still being confirmed. Give it a moment, then try again — you won't be charged twice.");
    },
    [getIdToken],
  );

  /** Resolves to the order id once booked, or null (with `error` set) when it wasn't. */
  const book = useCallback(
    async (request: CheckoutRequest): Promise<string | null> => {
      const orderId = orderIdRef.current ?? crypto.randomUUID();
      orderIdRef.current = orderId;
      setPending(true);
      setError(null);
      try {
        let reply = await callApi<CheckoutReply>(getIdToken, "/checkout", { method: "POST", body: { ...request, orderId } });

        if (reply.data.status === REQUIRES_ACTION && reply.data.clientSecret) {
          const stripe = stripePromise ? await stripePromise : null;
          if (!stripe) throw new ApiError(400, "Card payments aren't set up yet. Please call the studio to book.");
          const { error: bankError } = await stripe.handleNextAction({ clientSecret: reply.data.clientSecret });
          if (bankError) throw new ApiError(402, bankError.message ?? "Your bank didn't approve the payment.");
          reply = await complete(orderId);
        } else if (reply.status === 202) {
          reply = await complete(orderId);
        }

        orderIdRef.current = null;
        dispatch(resetAppointment());
        return orderId;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        // A definite answer closes this attempt, so the next tap starts a new one.
        if (status !== 0) orderIdRef.current = null;
        setError({ message: errorMessage(err), slotUnavailable: err instanceof ApiError && err.code === SLOT_UNAVAILABLE });
        return null;
      } finally {
        setPending(false);
      }
    },
    [getIdToken, complete, dispatch],
  );

  return { book, pending, error, clearError: () => setError(null) };
}
