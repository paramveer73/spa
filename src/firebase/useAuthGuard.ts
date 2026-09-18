import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/Routes";
import { useFirebase } from "./FirebaseContext";
import { SESSION_STATUS, type SessionStatus } from "./sessionStatus";

/** The one method the guard needs from the Firebase class. */
interface AuthSource {
  onAuthStateChanged: (callback: (user: unknown) => void) => () => void;
}

/**
 * Sends anyone without a session to sign-in, and reports where the check is.
 * Call it at the top of any page that must stay private, and render nothing
 * private until it returns SIGNED_IN — Firebase restores a saved session
 * asynchronously, so for the first moments of every visit it's CHECKING.
 *
 * Ported from arthalaw's app_state with three changes: it reads Firebase
 * through the context instead of importing the instance; it replaces the
 * history entry, so Back from the sign-in page doesn't bounce straight into
 * the guard; and it returns the status, so pages can hold their content back.
 */
export default function useAuthGuard(): SessionStatus {
  const firebase = useFirebase() as AuthSource | null;
  const navigate = useNavigate();
  const [status, setStatus] = useState<SessionStatus>(SESSION_STATUS.CHECKING);

  useEffect(() => {
    if (!firebase) return undefined;
    const unsubscribe = firebase.onAuthStateChanged((user) => {
      setStatus(user ? SESSION_STATUS.SIGNED_IN : SESSION_STATUS.SIGNED_OUT);
      if (!user) navigate(ROUTES.LOGIN, { replace: true });
    });
    return unsubscribe;
  }, [firebase, navigate]);

  return status;
}
