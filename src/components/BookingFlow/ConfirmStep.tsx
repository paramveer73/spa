import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Slot } from "@/components/calendar";
import { bookingPolicies } from "@/data";
import { selectCart } from "@/redux";
import { describeOwner } from "@/utils/employees";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/utils/format";
import { cartTotals, type CartLine } from "@/components/BookingMenu";

export interface ConfirmStepProps {
  slot: Slot | null;
  employees: { id: string; name: string; color: string }[];
}

/**
 * What's about to be booked. Taking the details and writing the appointment
 * needs the booking backend, which doesn't exist in this project yet — so this
 * step states the plan rather than pretending to submit it.
 */
export default function ConfirmStep({ slot, employees }: ConfirmStepProps) {
  const cart: CartLine[] = useSelector(selectCart);
  const totals = cartTotals(cart);
  const deposit = Math.round((totals.price * bookingPolicies.deposit_percent) / 100);

  return (
    <Box sx={{ maxWidth: 620, mx: "auto" }}>
      <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 2 }}>Almost there</Typography>

      {/* 1. When */}
      {slot && (
        <Box sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", mb: 2 }}>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            Your time
          </Typography>
          <Typography sx={{ fontWeight: 700, mt: 0.5 }}>
            {formatDate(slot.start)} · {formatTime(slot.start)}
            {/* Only known when the calendar filtered by the cart's length. */}
            {slot.appointmentEnd && ` – ${formatTime(slot.appointmentEnd)}`}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            with {describeOwner(employees, slot.employeeId as string | null).name}
          </Typography>
        </Box>
      )}

      {/* 2. What */}
      <Box sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="overline" sx={{ color: "primary.main" }}>
          Services
        </Typography>
        {cart.map((line) => (
          <Box key={line.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 1 }}>
            <Typography variant="body2">{line.name}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", flexShrink: 0 }}>
              {formatPrice(line.price)} · {formatDuration(line.duration)}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography sx={{ fontWeight: 800 }}>{formatPrice(totals.price)}</Typography>
          <Typography sx={{ color: "text.secondary" }}>{formatDuration(totals.duration)}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {bookingPolicies.deposit_percent}% deposit to book — {formatPrice(deposit)}
          {bookingPolicies.deposit_refundable ? "" : ", non-refundable"}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
        Taking contact details and writing the appointment is the last piece — it needs the booking backend, which
        isn&apos;t wired up here yet.
      </Alert>
    </Box>
  );
}
