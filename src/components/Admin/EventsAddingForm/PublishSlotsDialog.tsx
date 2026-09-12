import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { formatDate, formatTime } from "@/utils/format";
import { groupSlotsByWeek } from "./useSlotgenerator";

/** One slot as generateSlots() produces it — what gets written to Firebase. */
export interface GeneratedSlot {
    id: string;
    title: string;
    employeeId: string;
    start: string;
    end: string;
}

export interface PublishSlotsDialogProps {
    open: boolean;
    slots: GeneratedSlot[];
    /** Anchors week 0 for the grouping. */
    startDate: Date;
    professionalName?: string;
    onCancel: () => void;
    /**
     * Writes the ticked slots. Rejecting keeps the dialog open and shows the
     * error, so a failed write is never reported as published.
     */
    onConfirm: (selected: GeneratedSlot[]) => Promise<void>;
}

const weekLabel = (week: number) => (week === 0 ? "This week" : `Week ${week}`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The last look before anything is written. Every generated slot is listed,
 * grouped by week, and can be unticked — which is how a one-off like a
 * holiday gets skipped without the form needing a holiday calendar.
 */
export default function PublishSlotsDialog({
    open,
    slots,
    startDate,
    professionalName,
    onCancel,
    onConfirm,
}: PublishSlotsDialogProps) {
    // Tracks what's been *unticked* rather than what's ticked, so the default
    // (everything included) needs no setup and new slots start included.
    const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Each open starts clean: every row ticked, no leftover error.
    useEffect(() => {
        if (!open) return;
        setExcluded(new Set());
        setError(null);
    }, [open]);

    const groups = useMemo(() => groupSlotsByWeek(slots, startDate), [slots, startDate]);
    const selected = useMemo(() => slots.filter((slot) => !excluded.has(slot.id)), [slots, excluded]);

    const total = slots.length;
    const allSelected = selected.length === total;
    const noneSelected = selected.length === 0;

    const handleToggle = (id: string) => {
        setExcluded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleAll = () => {
        setExcluded(allSelected ? new Set(slots.map((slot) => slot.id)) : new Set());
    };

    const handleConfirm = async () => {
        setPending(true);
        setError(null);
        try {
            await onConfirm(selected);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setPending(false);
        }
    };

    if (total === 0) return null;

    const first = new Date(slots[0].start);
    const last = new Date(slots[total - 1].start);

    return (
        <Dialog
            open={open}
            // Not dismissable mid-write: closing would hide the outcome.
            onClose={pending ? undefined : onCancel}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle sx={{ fontWeight: 800 }}>Review before publishing</DialogTitle>

            <DialogContent dividers>
                {/* 1. Summary */}
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                    {plural(total, "slot")}
                    {professionalName ? ` for ${professionalName}` : ""} · {formatDate(first)} → {formatDate(last)}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        Nothing was published. {error}
                    </Alert>
                )}

                {/* 2. Slots, grouped by week */}
                <TableContainer sx={{ maxHeight: 420, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={!allSelected && !noneSelected}
                                        onChange={handleToggleAll}
                                        disabled={pending}
                                        slotProps={{ input: { "aria-label": "Include every slot" } }}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((group) => [
                                <TableRow key={`week-${group.week}`}>
                                    <TableCell
                                        colSpan={4}
                                        sx={{
                                            bgcolor: "action.hover",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            letterSpacing: 0.4,
                                            textTransform: "uppercase",
                                            color: "text.secondary",
                                        }}
                                    >
                                        {weekLabel(group.week)} · {plural(group.slots.length, "slot")}
                                    </TableCell>
                                </TableRow>,
                                ...group.slots.map((slot: GeneratedSlot) => {
                                    const included = !excluded.has(slot.id);
                                    return (
                                        <TableRow
                                            key={slot.id}
                                            hover
                                            onClick={() => !pending && handleToggle(slot.id)}
                                            sx={{ cursor: pending ? "default" : "pointer", opacity: included ? 1 : 0.45 }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={included}
                                                    disabled={pending}
                                                    slotProps={{ input: { "aria-label": `Include ${formatDate(new Date(slot.start))}` } }}
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(new Date(slot.start))}</TableCell>
                                            <TableCell>{formatTime(new Date(slot.start))}</TableCell>
                                            <TableCell>{formatTime(new Date(slot.end))}</TableCell>
                                        </TableRow>
                                    );
                                }),
                            ])}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            {/* 3. Actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onCancel} disabled={pending} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={pending || noneSelected}
                    variant="contained"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    {pending
                        ? "Publishing…"
                        : allSelected
                            ? `Publish ${plural(total, "slot")}`
                            : `Publish ${selected.length} of ${total}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
