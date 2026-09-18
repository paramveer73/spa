import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import AppLoader from "@/components/AppLoader";
import BookingFlow from "@/components/BookingFlow";
import PageHeader from "@/components/PageHeader";
import { SESSION_STATUS, useSignInRequired } from "@/firebase";

/**
 * Step one of booking: pick the services. The cart lives in Redux, so what's
 * chosen here survives navigating away and is what the date/time step will
 * read when it exists.
 *
 * Booking needs an account, so a signed-out visitor goes to sign-in first
 * and comes straight back. Nothing renders until the session is known —
 * otherwise the menu would flash up before the redirect.
 */
export default function BookingPage() {
  const session = useSignInRequired();
  if (session !== SESSION_STATUS.SIGNED_IN) return <AppLoader />;

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
        <BookingFlow />
      </Container>
    </Box>
  );
}
