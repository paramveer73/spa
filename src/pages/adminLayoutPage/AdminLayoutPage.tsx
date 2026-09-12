import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { LinearProgress } from "@mui/material";
import AdminShell from "@/components/Admin/AdminShell";
import AppLoader from "@/components/AppLoader";
import { useEmployees } from "@/components/calendar";
import { useAuthGuard, useFirebase } from "@/firebase";

interface SignOutSource {
  doSignOut: () => Promise<void>;
}

/**
 * Parent route of every admin screen. The guard, the team subscription and
 * the shell run here once, so switching tabs swaps only the screen below: the
 * frame stays put, and a screen's first-visit chunk load shows a thin bar
 * inside it instead of blanking the page.
 */
export default function AdminLayoutPage() {
  const session = useAuthGuard();
  const firebase = useFirebase() as SignOutSource | null;
  // Keeps state.employees.list live for every screen: the slot form, the
  // professional filters, the calendar colours and the team table.
  useEmployees();

  // The guard redirects on "signed-out". Until Firebase has confirmed a
  // session nothing private renders — the screens below hold clients' names,
  // emails and phone numbers.
  if (session !== "signed-in") return <AppLoader />;

  const handleSignOut = () => {
    // The guard hears the sign-out and does the redirect.
    void firebase?.doSignOut();
  };

  return (
    <AdminShell onSignOut={handleSignOut}>
      <Suspense fallback={<LinearProgress aria-label="Loading screen" sx={{ height: 2 }} />}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
}
