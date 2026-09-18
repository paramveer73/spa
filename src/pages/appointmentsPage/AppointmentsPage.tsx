import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import AppLoader from "@/components/AppLoader";
import PageHeader from "@/components/PageHeader";
import { SESSION_STATUS, useSignInRequired } from "@/firebase";
import { ROUTES } from "@/Routes";

/**
 * The signed-in client's appointments. Empty for now: bookings aren't saved
 * from this site yet, and when they are they'll need to carry the client's
 * uid for this page to find them.
 */
export default function AppointmentsPage() {
  const session = useSignInRequired();
  if (session !== SESSION_STATUS.SIGNED_IN) return <AppLoader />;

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default", color: "text.primary" }}>
      <Container maxWidth="md" sx={{ px: 2, py: { xs: 2, md: 4 } }}>
        {/* 1. Header */}
        <PageHeader />

        <Typography
          component="h1"
          sx={{ fontSize: "clamp(1.9rem, 6vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", mt: { xs: 4, md: 6 } }}
        >
          Your appointments
        </Typography>

        {/* 2. Empty state */}
        <Box
          sx={{
            mt: 3,
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <EventNoteOutlinedIcon sx={{ fontSize: 40, color: "text.secondary" }} />
          <Typography sx={{ fontWeight: 700, mt: 1.5 }}>No appointments yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 3 }}>
            Once you book, your appointments show up here.
          </Typography>
          <Button
            component={RouterLink}
            to={ROUTES.BOOK}
            variant="contained"
            sx={{
              minHeight: 48,
              px: 4,
              width: { xs: "100%", sm: "auto" },
              bgcolor: "text.primary",
              color: "background.default",
              "&:hover": { bgcolor: "text.primary" },
            }}
          >
            Book an appointment
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
