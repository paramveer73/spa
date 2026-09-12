import { Chip, type ChipProps } from "@mui/material";
import { TIME_STATUS_LABELS, type TimeStatus } from "@/utils/timeframe";

export interface StatusChipProps {
    status: TimeStatus;
}

// Only "today" is filled: it's the one status staff act on right now.
const CHIP: Record<TimeStatus, { color: ChipProps["color"]; variant: ChipProps["variant"] }> = {
    today: { color: "success", variant: "filled" },
    upcoming: { color: "primary", variant: "outlined" },
    past: { color: "default", variant: "outlined" },
};

/** Sort order for a status column: today first, past last. */
export const STATUS_RANK: Record<TimeStatus, number> = { today: 0, upcoming: 1, past: 2 };

export default function StatusChip({ status }: StatusChipProps) {
    const { color, variant } = CHIP[status];
    return <Chip size="small" label={TIME_STATUS_LABELS[status]} color={color} variant={variant} sx={{ fontWeight: 600 }} />;
}
