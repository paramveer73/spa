import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInPathFor } from "@/utils/nextPath";
import { useSession } from "./SessionContext";
import { SESSION_STATUS, type SessionStatus } from "./sessionStatus";

/**
 * The client-side counterpart of useAuthGuard: sends anyone without a session
 * to the client sign-in page, set to bring them straight back here. Render
 * nothing that needs the session until this returns SIGNED_IN.
 *
 * Replaces the history entry, so Back from the sign-in page leaves the site
 * rather than bouncing into this redirect again.
 */
export default function useSignInRequired(): SessionStatus {
  const { status } = useSession();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (status === SESSION_STATUS.SIGNED_OUT) navigate(signInPathFor(`${pathname}${search}`), { replace: true });
  }, [status, pathname, search, navigate]);

  return status;
}
