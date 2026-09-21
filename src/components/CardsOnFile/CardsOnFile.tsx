import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import AddCardOutlinedIcon from "@mui/icons-material/AddCardOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ConfirmDialog from "@/components/Admin/ConfirmDialog";
import AddCardForm from "./AddCardForm";
import type { SavedCard } from "./useCards";

export interface CardsOnFileProps {
  cards: SavedCard[];
  loading: boolean;
  error: string | null;
  /** The card this booking will use. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onRequestSetup: () => Promise<string>;
  /** A card was just saved; the parent refreshes the list and selects it. */
  onCardAdded: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMakeDefault: (id: string) => Promise<void>;
}

const BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  jcb: "JCB",
  diners: "Diners Club",
  unionpay: "UnionPay",
};

const cardLabel = (card: SavedCard) => `${BRANDS[card.brand] ?? "Card"} •••• ${card.last4}`;
const expiry = (card: SavedCard) =>
  card.expMonth && card.expYear ? `Expires ${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}` : "";

/**
 * The client's saved cards, one picked for this booking. A card on file is
 * what secures a booking, so with none saved the add form opens by itself.
 */
export default function CardsOnFile({
  cards,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
  onRequestSetup,
  onCardAdded,
  onRemove,
  onMakeDefault,
}: CardsOnFileProps) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<SavedCard | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading) return <Skeleton variant="rounded" height={64} sx={{ borderRadius: 3 }} />;
  if (error && cards.length === 0) {
    return (
      <Alert
        severity="error"
        sx={{ borderRadius: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const showForm = adding || cards.length === 0;

  const handleAdded = async (id: string) => {
    await onCardAdded(id);
    setAdding(false);
  };

  const handleMakeDefault = async (id: string) => {
    setBusyId(id);
    try {
      await onMakeDefault(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      {/* 1. Saved cards */}
      <Box role="radiogroup" aria-label="Card for this booking" sx={{ display: "grid", gap: 1 }}>
        {cards.map((card) => {
          const selected = card.id === selectedId;
          return (
            <Box
              key={card.id}
              onClick={() => onSelect(card.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                pr: 0.5,
                minHeight: 64,
                borderRadius: 3,
                border: 1,
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? "action.selected" : "transparent",
                cursor: "pointer",
                transition: "border-color .2s, background-color .2s",
              }}
            >
              <Radio checked={selected} value={card.id} slotProps={{ input: { "aria-label": cardLabel(card) } }} />
              <Box sx={{ flexGrow: 1, minWidth: 0, py: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{cardLabel(card)}</Typography>
                  {card.isDefault && <Chip size="small" label="Default" variant="outlined" />}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {expiry(card)}
                  {!card.isDefault && (
                    <Button
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleMakeDefault(card.id);
                      }}
                      disabled={busyId === card.id}
                      sx={{ ml: 1, minWidth: 0, p: 0, fontSize: 12, verticalAlign: "baseline" }}
                    >
                      {busyId === card.id ? "Saving…" : "Make default"}
                    </Button>
                  )}
                </Typography>
              </Box>
              <IconButton
                aria-label={`Remove ${cardLabel(card)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setRemoving(card);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* 2. Adding one */}
      {showForm ? (
        <Box sx={{ mt: cards.length ? 2 : 0, p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <AddCardForm
            onRequestSetup={onRequestSetup}
            onAdded={handleAdded}
            onCancel={cards.length ? () => setAdding(false) : undefined}
          />
        </Box>
      ) : (
        <Button startIcon={<AddCardOutlinedIcon />} onClick={() => setAdding(true)} sx={{ mt: 1.5, minHeight: 44 }}>
          Add another card
        </Button>
      )}

      {/* 3. Removing one */}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this card?"
        confirmLabel="Remove"
        pendingLabel="Removing…"
        onConfirm={() => (removing ? onRemove(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      >
        {removing && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {cardLabel(removing)} comes off your account. Bookings already made keep their retainer.
          </Typography>
        )}
      </ConfirmDialog>
    </Box>
  );
}
