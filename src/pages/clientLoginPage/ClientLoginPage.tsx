import { Navigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import AppLoader from "@/components/AppLoader";
import ClientLogin from "@/components/ClientLogin";
import PageHeader from "@/components/PageHeader";
import { SESSION_STATUS, useSession } from "@/firebase";
import { ROUTES } from "@/Routes";
import { readNextPath, signInPathFor } from "@/utils/nextPath";

/**
 * Client sign-in. Reached from any page that needs a session, with `?next=`
 * naming where to return. Signing in here — by Google, or on the page the
 * emailed link reopens — flips the session, and this page sends them on.
 */
export default function ClientLoginPage() {
  const { status } = useSession();
  const { search } = useLocation();
  const next = readNextPath(search, ROUTES.BOOK);

  if (status === SESSION_STATUS.CHECKING) return <AppLoader />;
  if (status === SESSION_STATUS.SIGNED_IN) return <Navigate to={next} replace />;

  // The emailed link reopens this page with the same destination, so
  // finishing sign-in there still lands where they were heading.
  const returnUrl = new URL(signInPathFor(next), window.location.origin).href;

  return (
    <Box
      component="main"
      sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}
    >
      {/* 1. Header */}
      <Container maxWidth="md" sx={{ px: 2, pt: { xs: 2, md: 4 } }}>
        <PageHeader />
      </Container>

      {/* 2. Sign-in — top-aligned on phones, where the keyboard takes the
          bottom half; centred once there's height to spare. */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          px: 2,
          pt: { xs: 5, sm: 0 },
          pb: 6,
        }}
      >
        <ClientLogin returnUrl={returnUrl} />
      </Box>
    </Box>
  );
}
