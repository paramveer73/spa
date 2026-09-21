import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { alpha } from "@mui/material/styles";
import type { BookingPolicies } from "@/data";
import { BRAND } from "@/theme";
import { removeServiceForAppointment, resetAppointment, selectBookingPolicies, selectCart } from "@/redux";
import { formatDuration, formatPrice } from "@/utils/format";
import { cartTotals, depositFor, type CartLine } from "./cart";

export interface CartSummaryProps {
  /** Moves the flow on to picking a time. */
  onContinue: () => void;
  /** Drawn as its own bordered card; off when it sits inside the phone/tablet sheet, which is the frame. */
  framed?: boolean;
}

/** Running total of what's been picked, and the way on to the next step. */
export default function CartSummary({ onContinue, framed = true }: CartSummaryProps) {
  const dispatch = useDispatch();
  const cart: CartLine[] = useSelector(selectCart);
  const policies: BookingPolicies | null = useSelector(selectBookingPolicies);

  const totals = cartTotals(cart);

  return (
    <Box
      sx={
        framed
          ? { p: { xs: 2.5, md: 3 }, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }
          : undefined
      }
    >
      <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Your Appointment</Typography>

      {totals.count === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          Nothing picked yet. Add a service from the menu and it shows up here.
        </Typography>
      ) : (
        <>
          <Box sx={{ mt: 2 }}>
            {cart.map((line) => (
              // `appear` is what makes this animate on add: each line mounts
              // already `in`, so it opens and fades instead of snapping in.
              <Collapse key={line.id} in appear timeout={320}>
                <Fade in appear timeout={420}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 1,
                      px: 1.25,
                      // Pulled back out so the rows still line up with the
                      // panel's own padding — only the wash is wider.
                      mx: -1.25,
                      borderRadius: 1.5,
                      transition: "background-color .2s ease",
                      // One-shot wash of brand colour, so the eye catches which
                      // line just landed.
                      animation: "cartLineLanded .9s ease-out",
                      "@keyframes cartLineLanded": {
                        from: { backgroundColor: alpha(BRAND.accentSoft, 0.55) },
                        to: { backgroundColor: "transparent" },
                      },
                      // The same wash, held while the pointer is on a line, with
                      // its remove button stepping forward.
                      "& .cart-line-remove": { color: "text.secondary", transition: "color .2s ease" },
                      "&:hover, &:focus-within": {
                        bgcolor: alpha(BRAND.accentSoft, 0.3),
                        "& .cart-line-remove": { color: "text.primary" },
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {line.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {formatPrice(line.price)} · {formatDuration(line.duration)}
                      </Typography>
                    </Box>
                    <IconButton
                      className="cart-line-remove"
                      size="small"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => dispatch(removeServiceForAppointment({ id: line.id }))}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Fade>
              </Collapse>
            ))}
          </Box>

          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              {/* Keyed on the amount: a new total is a new node, so it fades in. */}
              <Fade key={totals.price} in appear timeout={500}>
                <Typography sx={{ fontWeight: 800 }}>{formatPrice(totals.price)}</Typography>
              </Fade>
              <Typography sx={{ color: "text.secondary" }}>{formatDuration(totals.duration)}</Typography>
            </Box>
            {/* The studio takes a deposit to hold the slot; showing it here
                means no surprise at the payment step. */}
            {policies && (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                {policies.deposit_percent}% deposit to book — {formatPrice(depositFor(totals.price, policies))}
                {policies.deposit_refundable ? "" : ", non-refundable"}
              </Typography>
            )}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={onContinue}
            sx={{ mt: 2, py: 1.4, bgcolor: "text.primary", color: "background.default", "&:hover": { bgcolor: "text.primary" } }}
          >
            Choose a time
          </Button>
          <Button
            fullWidth
            size="small"
            color="inherit"
            onClick={() => dispatch(resetAppointment())}
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Clear
          </Button>
        </>
      )}
    </Box>
  );
}
