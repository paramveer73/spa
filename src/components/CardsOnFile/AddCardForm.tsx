import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { errorMessage } from "@/api/apiClient";
import { stripePromise } from "@/api/stripe";

export interface AddCardFormProps {
  /** Asks the server for a SetupIntent client secret. */
  onRequestSetup: () => Promise<string>;
  /** Called with the new card's id once Stripe has saved it. */
  onAdded: (paymentMethodId: string) => void;
  /** Hidden when there's nothing to go back to — no cards yet. */
  onCancel?: () => void;
}

const ACTION_SX = { minHeight: 48 } as const;

/**
 * Collects a card with Stripe's own field, which posts it straight to Stripe:
 * the number never passes through this site or its server. The card is saved
 * to the client's customer, ready to secure this booking and future ones.
 */
export default function AddCardForm({ onRequestSetup, onAdded, onCancel }: AddCardFormProps) {
  const theme = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One SetupIntent per opening of the form.
  useEffect(() => {
    let cancelled = false;
    onRequestSetup()
      .then((secret) => !cancelled && setClientSecret(secret))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [onRequestSetup]);

  // Stripe's field lives in an iframe and can't read the page's CSS, so the
  // theme's colours are handed to it; it follows light and dark mode too.
  const options = useMemo<StripeElementsOptions | null>(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: theme.palette.mode === "dark" ? "night" : "stripe",
              variables: {
                colorPrimary: theme.palette.primary.main,
                colorBackground: theme.palette.background.paper,
                colorText: theme.palette.text.primary,
                borderRadius: "12px",
              },
            },
          }
        : null,
    [clientSecret, theme],
  );

  if (!stripePromise) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        Card payments aren&apos;t set up yet. Please call the studio to book.
      </Alert>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }
  if (!options) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CardFields onAdded={onAdded} onCancel={onCancel} />
    </Elements>
  );
}

/** The field and its buttons. Separate because useStripe/useElements only work inside <Elements>. */
function CardFields({ onAdded, onCancel }: Pick<AddCardFormProps, "onAdded" | "onCancel">) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);
    // "if_required": cards finish here, in place — a bank's 3-D Secure check
    // opens as a modal over the page rather than navigating away from it.
    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error.message ?? "That card couldn't be saved. Check the details and try again.");
      return;
    }
    const method = result.setupIntent.payment_method;
    if (method) onAdded(typeof method === "string" ? method : method.id);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ ...ACTION_SX, flexGrow: 1 }}
        >
          {saving ? "Saving card…" : "Save card"}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving} color="inherit" sx={ACTION_SX}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
}
