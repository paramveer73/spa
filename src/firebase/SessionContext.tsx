import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useFirebase } from "./FirebaseContext";
import { SESSION_STATUS, type SessionStatus } from "./sessionStatus";

/** The parts of a Firebase user the site shows: the avatar and its menu. */
export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Session {
  status: SessionStatus;
  user: SessionUser | null;
}

interface AuthSource {
  onAuthStateChanged: (callback: (user: SessionUser | null) => void) => () => void;
}

const CHECKING: Session = { status: SESSION_STATUS.CHECKING, user: null };

const SessionContext = createContext<Session | null>(null);

export interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Who's signed in, for the whole app, from one auth subscription. The navbar
 * avatar, the booking page's sign-in requirement and the sign-in page all
 * read this rather than each subscribing — a per-component listener starts at
 * CHECKING on every mount, so the avatar would blink out on each page change.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const firebase = useFirebase() as AuthSource | null;
  const [session, setSession] = useState<Session>(CHECKING);

  useEffect(() => {
    if (!firebase) return undefined;
    return firebase.onAuthStateChanged((user) => {
      // Copied field by field: the Firebase User is a live, mutable object,
      // and handing it to React state would hide later changes from it.
      setSession(
        user
          ? {
              status: SESSION_STATUS.SIGNED_IN,
              user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL },
            }
          : { status: SESSION_STATUS.SIGNED_OUT, user: null },
      );
    });
  }, [firebase]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** The current session. Throws outside <SessionProvider> — a missing provider would otherwise read as signed out forever. */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>.");
  return session;
}
