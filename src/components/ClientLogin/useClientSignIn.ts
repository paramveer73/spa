import { useEffect, useEffectEvent, useRef, useState } from "react";
import { brand } from "@/data/brand";
import { useFirebase } from "@/firebase";
import { SIGN_IN_PHASE, type SignInPhase } from "./signInPhase";

/** The four auth methods sign-in needs from the Firebase class. */
interface ClientAuthSource {
  doSignInWithGoogle: () => Promise<unknown>;
  doSendSignInLinkToEmail: (email: string, returnUrl: string) => Promise<void>;
  isSignInWithEmailLink: (link: string) => boolean;
  doSignInWithEmailLink: (email: string, link: string) => Promise<unknown>;
}

// The address the link was sent to, remembered so the link can finish
// sign-in without asking again. Firebase requires the address alongside the
// link: that pairing is what stops a forwarded link from signing someone else in.
const PENDING_EMAIL_KEY = `${brand.slug}:sign-in-email`;

// Firebase appends these to the return URL; once the link is spent they're
// just noise, and a reload would retry a dead code.
const LINK_PARAMS = ["apiKey", "oobCode", "mode", "lang", "continueUrl", "tenantId"];

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Closing the Google window is a change of mind, not an error.
const SILENT_ERRORS = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/invalid-action-code": "This sign-in link has expired or was already used. Send yourself a new one.",
  "auth/expired-action-code": "This sign-in link has expired. Send yourself a new one.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "No connection. Check your internet and try again.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/operation-not-allowed": "This way of signing in isn't switched on yet. Try the other option.",
  "auth/unauthorized-domain": "Sign-in isn't set up for this web address yet.",
  "auth/unauthorized-continue-uri": "Sign-in isn't set up for this web address yet.",
};

const GENERIC_ERROR = "Something went wrong signing you in. Try again.";

const errorCode = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

// Storage can throw (private windows, blocked site data). Losing the
// remembered address only means asking for it once more, so failures are
// swallowed rather than surfaced.
function rememberEmail(email: string) {
  try {
    window.localStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    /* ask again on return */
  }
}

function recallEmail(): string | null {
  try {
    return window.localStorage.getItem(PENDING_EMAIL_KEY);
  } catch {
    return null;
  }
}

function forgetEmail() {
  try {
    window.localStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    /* nothing to clean up */
  }
}

function dropLinkParams() {
  const url = new URL(window.location.href);
  LINK_PARAMS.forEach((param) => url.searchParams.delete(param));
  // Straight to history rather than through the router: nothing reads these
  // params after this, and a router navigation would re-render the page.
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Whether this page load is the emailed link coming back. With the address
 * remembered from sending it, sign-in finishes straight away; opened in
 * another browser or device there's nothing remembered, so it's asked for.
 */
function arrivalPhase(firebase: ClientAuthSource | null): SignInPhase {
  if (!firebase?.isSignInWithEmailLink(window.location.href)) return SIGN_IN_PHASE.IDLE;
  return recallEmail() ? SIGN_IN_PHASE.COMPLETING : SIGN_IN_PHASE.NEEDS_EMAIL;
}

/**
 * Client sign-in: Google, or a passwordless link by email. `returnUrl` is the
 * absolute URL the emailed link opens — this page, carrying `?next=`.
 *
 * Success isn't reported here. Signing in changes the session, and the page
 * watching the session moves on; this hook only tracks the attempt.
 */
export default function useClientSignIn(returnUrl: string) {
  const firebase = useFirebase() as ClientAuthSource | null;
  const [phase, setPhase] = useState<SignInPhase>(() => arrivalPhase(firebase));
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  // StrictMode runs mount effects twice. A link's code is single-use, so a
  // second attempt would fail and report an error over a sign-in that worked.
  const linkHandledRef = useRef(false);

  const fail = (caught: unknown, fallbackPhase: SignInPhase) => {
    const code = errorCode(caught);
    setPhase(fallbackPhase);
    setError(SILENT_ERRORS.has(code) ? null : (ERROR_MESSAGES[code] ?? GENERIC_ERROR));
  };

  const finishLink = async (email: string) => {
    if (!firebase) return;
    try {
      await firebase.doSignInWithEmailLink(email.trim(), window.location.href);
      forgetEmail();
    } catch (caught) {
      // A wrong address can be retyped; a dead link can't be reused.
      const code = errorCode(caught);
      const retypable = code === "auth/invalid-email";
      if (!retypable) dropLinkParams();
      fail(caught, retypable ? SIGN_IN_PHASE.NEEDS_EMAIL : SIGN_IN_PHASE.IDLE);
    }
  };

  /** Finishes the link with an address typed in, for the NEEDS_EMAIL case. */
  const completeWithEmail = (email: string) => {
    setError(null);
    setPhase(SIGN_IN_PHASE.COMPLETING);
    return finishLink(email);
  };

  // An effect event, so the mount-only effect below always sees the current
  // phase and handlers without re-running when they change.
  const finishOnArrival = useEffectEvent(() => {
    const email = recallEmail();
    if (phase === SIGN_IN_PHASE.COMPLETING && email) void finishLink(email);
  });

  useEffect(() => {
    if (linkHandledRef.current) return;
    linkHandledRef.current = true;
    finishOnArrival();
  }, []);

  const signInWithGoogle = async () => {
    if (!firebase) return;
    setError(null);
    setPhase(SIGN_IN_PHASE.GOOGLE);
    try {
      await firebase.doSignInWithGoogle();
    } catch (caught) {
      fail(caught, SIGN_IN_PHASE.IDLE);
    }
  };

  const sendLink = async (rawEmail: string) => {
    if (!firebase) return;
    const email = rawEmail.trim();
    if (!EMAIL_SHAPE.test(email)) {
      setError(ERROR_MESSAGES["auth/invalid-email"]);
      return;
    }
    setError(null);
    setPhase(SIGN_IN_PHASE.SENDING);
    try {
      await firebase.doSendSignInLinkToEmail(email, returnUrl);
      rememberEmail(email);
      setSentTo(email);
      setPhase(SIGN_IN_PHASE.LINK_SENT);
    } catch (caught) {
      fail(caught, SIGN_IN_PHASE.IDLE);
    }
  };

  const startOver = () => {
    setError(null);
    setPhase(SIGN_IN_PHASE.IDLE);
  };

  return { phase, error, sentTo, signInWithGoogle, sendLink, completeWithEmail, startOver };
}
