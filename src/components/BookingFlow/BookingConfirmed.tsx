import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { ROUTES } from "@/Routes";
import { formatDate, formatPrice, formatTime } from "@/utils/format";

/** What was booked, captured at the moment of booking — the cart is cleared right after. */
export interface BookingSummary {
  start: Date;
  end: Date;
  professional: string;
  services: string[];
  retainer: number;
  cardLabel: string;
}

export interface BookingConfirmedProps {
  summary: BookingSummary;
  onBookAnother: () => void;
}

/** The end of the flow: what's booked, and what was charged to which card. */
export default function BookingConfirmed({ summary, onBookAnother }: BookingConfirmedProps) {
  return (
    <Box sx={{ maxWidth: 620, mx: "auto", textAlign: "center" }}>
      {/* 1. Done */}
      <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "primary.main" }} />
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 26, sm: 30 }, mt: 1 }}>
        You&apos;re booked
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 1 }}>
        {formatDate(summary.start)} · {formatTime(summary.start)} – {formatTime(summary.end)}
        <br />
        with {summary.professional}
      </Typography>

      {/* 2. What and what it cost */}
      <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", textAlign: "left" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {summary.services.join(", ")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
          {summary.retainer > 0
            ? `${formatPrice(summary.retainer)} retainer charged to ${summary.cardLabel}. A receipt is on its way to your email.`
            : `No retainer was due. ${summary.cardLabel} is on file to secure the appointment.`}
        </Typography>
      </Box>

      {/* 3. Where next */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", gap: 1, mt: 3 }}>
        <Button
          variant="contained"
          onClick={onBookAnother}
          sx={{ minHeight: 48, px: 4, bgcolor: "text.primary", color: "background.default", "&:hover": { bgcolor: "text.primary" } }}
        >
          Book something else
        </Button>
        <Button component={RouterLink} to={ROUTES.HOME} color="inherit" sx={{ minHeight: 48 }}>
          Back to the studio
        </Button>
      </Box>
    </Box>
  );
}
