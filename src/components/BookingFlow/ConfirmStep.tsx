import { useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CardsOnFile, { useCards, type SavedCard } from "@/components/CardsOnFile";
import type { Slot } from "@/components/calendar";
import { cartTotals, depositFor, repriceCart, type CartLine } from "@/components/BookingMenu";
import type { BookingPolicies, CatalogService } from "@/data";
import { useSession } from "@/firebase";
import { selectBookingPolicies, selectCart, selectCatalogLoaded, selectCatalogServices } from "@/redux";
import { describeOwner } from "@/utils/employees";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/utils/format";
import type { BookingSummary } from "./BookingConfirmed";
import useCheckout from "./useCheckout";

export interface ConfirmStepProps {
  slot: Slot | null;
  employees: { id: string; name: string; color: string }[];
  onBooked: (summary: BookingSummary) => void;
  /** The time went to someone else; back to the calendar with the cart intact. */
  onPickAnotherTime: () => void;
}

const MS_PER_MINUTE = 60 * 1000;
const NOTE_MAX = 500;
// Same bounds the server checks: a real number, with or without formatting.
const phoneDigits = (phone: string) => phone.replace(/\D/g, "").length;
const isPhoneValid = (phone: string) => phoneDigits(phone) >= 7 && phoneDigits(phone) <= 15;

const BRANDS: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };
const cardLabel = (card: SavedCard) => `${BRANDS[card.brand] ?? "Card"} •••• ${card.last4}`;

/**
 * The last step: what's being booked, who's booking, the card that secures
 * it, and the retainer — ticked to agree, then charged. Prices are today's
 * catalog prices (the server charges those), not the ones the cart was
 * filled at.
 */
export default function ConfirmStep({ slot, employees, onBooked, onPickAnotherTime }: ConfirmStepProps) {
  const cart: CartLine[] = useSelector(selectCart);
  const services: CatalogService[] = useSelector(selectCatalogServices);
  const catalogLoaded: boolean = useSelector(selectCatalogLoaded);
  const policies: BookingPolicies | null = useSelector(selectBookingPolicies);
  const { user } = useSession();
  const cardsOnFile = useCards();
  const checkout = useCheckout();

  const [name, setName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState(false);

  if (!slot) return null;

  const { lines, missing } = catalogLoaded ? repriceCart(cart, services) : { lines: cart, missing: [] };
  const totals = cartTotals(lines);
  const retainer = policies ? depositFor(totals.price, policies) : null;
  const end = new Date(slot.start.getTime() + totals.duration * MS_PER_MINUTE);
  const professional = describeOwner(employees, slot.employeeId as string | null).name;

  // The picked card while it still exists; otherwise the default, then the first.
  const cards = cardsOnFile.cards;
  const card =
    cards.find((saved) => saved.id === pickedCardId) ?? cards.find((saved) => saved.isDefault) ?? cards[0] ?? null;

  const nameError = touched && !name.trim() ? "Enter your name." : "";
  const phoneError = touched && !isPhoneValid(phone) ? "Enter a phone number the studio can reach you on." : "";
  const ready =
    catalogLoaded && missing.length === 0 && lines.length > 0 && retainer !== null && Boolean(card) && accepted;

  const handleCardAdded = async (id: string) => {
    await cardsOnFile.refresh();
    setPickedCardId(id);
  };

  const handleBook = async () => {
    setTouched(true);
    if (!ready || !card || retainer === null || !name.trim() || !isPhoneValid(phone)) return;
    const orderId = await checkout.book({
      serviceIds: lines.map((line) => line.id),
      // Every slot the appointment spans when the calendar joined several;
      // just the one otherwise.
      eventKeys: slot.eventKeys ?? (slot.eventKey ? [slot.eventKey] : []),
      paymentMethodId: card.id,
      retainerAmount: retainer,
      retainerAccepted: accepted,
      contact: { name: name.trim(), phone: phone.trim(), note: note.trim() },
    });
    if (orderId) {
      onBooked({
        start: slot.start,
        end,
        professional,
        services: lines.map((line) => line.name),
        retainer,
        cardLabel: cardLabel(card),
      });
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 2 }}>Almost there</Typography>

      {/* Same 8/4 split and spacing as the menu on desktop, so payment lands
          where the cart sat a step ago. Phones stack it: details, then payment. */}
      <Grid container spacing={{ xs: 2, md: 3, lg: 5 }} sx={{ alignItems: "flex-start" }}>
        {/* Left — the appointment and who's booking it */}
        <Grid size={{ xs: 12, md: 6, lg: 8 }} sx={{ minWidth: 0, display: "grid", gap: 2 }}>
          {/* 1. When */}
          <Section title="Your time">
            <Typography sx={{ fontWeight: 700 }}>
              {formatDate(slot.start)} · {formatTime(slot.start)} – {formatTime(end)}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              with {professional}
            </Typography>
          </Section>

          {/* 2. What */}
          <Section title="Services">
            {lines.map((line) => (
              <Box key={line.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 1 }}>
                <Typography variant="body2">{line.name}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", flexShrink: 0 }}>
                  {formatPrice(line.price)} · {formatDuration(line.duration)}
                </Typography>
              </Box>
            ))}
            {missing.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                {missing.map((line) => line.name).join(", ")} {missing.length === 1 ? "is" : "are"} no longer on the
                menu. Go back to Services to remove {missing.length === 1 ? "it" : "them"}.
              </Alert>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Typography sx={{ fontWeight: 800 }}>{formatPrice(totals.price)}</Typography>
              <Typography sx={{ color: "text.secondary" }}>{formatDuration(totals.duration)}</Typography>
            </Box>
          </Section>

          {/* 3. Who */}
          <Section title="Your details">
            {user?.email && (
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, overflowWrap: "anywhere" }}>
                Booking as {user.email}
              </Typography>
            )}
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                fullWidth
                error={Boolean(nameError)}
                helperText={nameError || " "}
              />
              <TextField
                label="Phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                required
                fullWidth
                error={Boolean(phoneError)}
                helperText={phoneError || "In case the studio needs to reach you about the appointment."}
                slotProps={{ htmlInput: { inputMode: "tel" } }}
              />
              <TextField
                label="Anything the studio should know? (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                multiline
                minRows={2}
                fullWidth
                slotProps={{ htmlInput: { maxLength: NOTE_MAX } }}
              />
            </Box>
          </Section>
        </Grid>

        {/* Right — paying for it, drawn as a card like the cart before it */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            {/* 4. The card that secures it */}
            <Box>
              <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.5 }}>
                Card on file
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                A saved card is needed to hold your appointment.
              </Typography>
              <CardsOnFile
                cards={cards}
                loading={cardsOnFile.loading}
                error={cardsOnFile.error}
                selectedId={card?.id ?? null}
                onSelect={setPickedCardId}
                onRetry={() => void cardsOnFile.refresh()}
                onRequestSetup={cardsOnFile.startAdding}
                onCardAdded={handleCardAdded}
                onRemove={cardsOnFile.removeCard}
                onMakeDefault={cardsOnFile.makeDefault}
              />
            </Box>

            {/* 5. The retainer, agreed to in so many words */}
            {policies && retainer !== null && (
              <FormControlLabel
                sx={{ alignItems: "flex-start", mx: 0, gap: 1, pt: 2, borderTop: 1, borderColor: "divider" }}
                control={
                  <Checkbox
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    sx={{ p: 0.5, mt: -0.25 }}
                  />
                }
                label={
                  <Typography variant="body2">
                    I understand that {policies.deposit_percent}% of my booking ({formatPrice(retainer)}) is a
                    {policies.deposit_refundable ? " " : " non-refundable "}retainer, charged now to secure my
                    appointment.
                  </Typography>
                }
              />
            )}
            {catalogLoaded && !policies && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Online booking is paused while the studio updates its policies. Please call to book.
              </Alert>
            )}

            {/* 6. Book */}
            {checkout.error && (
              <Alert
                severity="error"
                sx={{ borderRadius: 2 }}
                action={
                  checkout.error.slotUnavailable ? (
                    <Button color="inherit" size="small" onClick={onPickAnotherTime}>
                      Pick another time
                    </Button>
                  ) : undefined
                }
              >
                {checkout.error.message}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={() => void handleBook()}
              disabled={!ready || checkout.pending}
              startIcon={checkout.pending ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                minHeight: 52,
                fontSize: 15,
                bgcolor: "text.primary",
                color: "background.default",
                "&:hover": { bgcolor: "text.primary" },
              }}
            >
              {checkout.pending
                ? "Booking…"
                : retainer
                  ? `Book and pay ${formatPrice(retainer)} retainer`
                  : "Book appointment"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/** One bordered block of the summary. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: 1, borderColor: "divider" }}>
      <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
