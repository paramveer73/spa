import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import BookingFlow from "@/components/BookingFlow";
import PageHeader from "@/components/PageHeader";
import { useCatalog } from "@/hooks";
import { ROUTES } from "@/Routes";
import { signInPathFor } from "@/utils/nextPath";

// Signing in from the menu comes straight back to it.
const SIGN_IN_PATH = signInPathFor(ROUTES.BOOK);

/**
 * Booking: pick the services, a time, then confirm. The cart lives in Redux,
 * so what's chosen here survives navigating away.
 *
 * Open to everyone, so the menu and its prices can be read before signing
 * in. Adding to the cart needs a session — the menu itself offers sign-in
 * where the cart would be.
 */
export default function BookingPage() {
  useCatalog();

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default", color: "text.primary" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        {/* 1. Header */}
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <PageHeader />
        </Box>

        <Typography
          component="h1"
          sx={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          Book an appointment
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 1.5, mb: { xs: 3, md: 5 }, maxWidth: 520 }}>
          Choose everything you'd like in one visit — the total time decides which openings fit.
        </Typography>

        {/* 2. Services → time → confirm */}
        <BookingFlow signInPath={SIGN_IN_PATH} />
      </Container>
    </Box>
  );
}
