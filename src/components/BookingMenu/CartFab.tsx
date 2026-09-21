import { useState } from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Fab from "@mui/material/Fab";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { selectCart } from "@/redux";
import { formatPrice } from "@/utils/format";
import CartSummary from "./CartSummary";
import { cartTotals, type CartLine } from "./cart";

export interface CartFabProps {
  signedIn: boolean;
  /** Where "Sign in" goes: the sign-in page, set to return here. */
  signInPath: string;
  onContinue: () => void;
}

// Clear of the home indicator on phones that have one.
const BOTTOM = "calc(16px + env(safe-area-inset-bottom))";

/**
 * The cart on tablets and phones, where there's no room for it beside the
 * menu. Signed out it's the way to sign in; signed in it opens the cart as a
 * sheet from the bottom, with "Choose a time" in thumb reach.
 */
export default function CartFab({ signedIn, signInPath, onContinue }: CartFabProps) {
  const cart: CartLine[] = useSelector(selectCart);
  const [open, setOpen] = useState(false);
  const totals = cartTotals(cart);

  const fabSx = {
    position: "fixed",
    right: 16,
    bottom: BOTTOM,
    zIndex: (theme: { zIndex: { speedDial: number } }) => theme.zIndex.speedDial,
    gap: 1,
    px: 2.5,
    textTransform: "none",
    fontWeight: 700,
    bgcolor: "text.primary",
    color: "background.default",
    "&:hover": { bgcolor: "text.primary" },
  } as const;

  if (!signedIn) {
    return (
      <Fab variant="extended" component={RouterLink} to={signInPath} sx={fabSx}>
        <ShoppingBagOutlinedIcon />
        Sign in to book
      </Fab>
    );
  }

  const handleContinue = () => {
    setOpen(false);
    onContinue();
  };

  return (
    <>
      {/* 1. The button — hidden while the sheet it opens is up */}
      {!open && (
        <Fab
          variant="extended"
          onClick={() => setOpen(true)}
          aria-label={`Your Appointment, ${totals.count} service${totals.count === 1 ? "" : "s"}`}
          sx={fabSx}
        >
          <Badge badgeContent={totals.count} invisible={totals.count === 0} color="primary" overlap="circular">
            <ShoppingBagOutlinedIcon />
          </Badge>
          {totals.count === 0 ? "Your Appointment" : `Your Appointment · ${formatPrice(totals.price)}`}
        </Fab>
      )}

      {/* 2. The cart, as a bottom sheet */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: "85dvh",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              px: 2.5,
              pt: 1.5,
              pb: BOTTOM,
            },
          },
        }}
      >
        {/* Grab handle — the sheet closes on a tap outside or a swipe of the backdrop. */}
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mb: 2 }} />
        <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
          <CartSummary onContinue={handleContinue} framed={false} />
        </Box>
      </Drawer>
    </>
  );
}
