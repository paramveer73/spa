import { loadStripe, type Stripe } from "@stripe/stripe-js";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

/**
 * Stripe.js, loaded once. Stripe asks for loadStripe to be called outside any
 * component — calling it per render would load the script again. This module
 * is only imported by the booking flow's chunk, so the rest of the site
 * never loads Stripe at all.
 *
 * Null when the publishable key isn't set, which the card form reports.
 */
export const stripePromise: Promise<Stripe | null> | null = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;
