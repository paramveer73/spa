import { useState, type ReactNode } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    children: ReactNode;
    /** e.g. "Cancel booking", "Delete 3 slots". */
    confirmLabel: string;
    /** Shown on the button while `onConfirm` runs. */
    pendingLabel?: string;
    /**
     * Does the destructive write. Resolving closes the dialog; rejecting keeps
     * it open with the error, so a failed delete is never reported as done.
     */
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

/** The one confirmation for every destructive admin action, replacing window.confirm. */
export default function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel,
    pendingLabel = "Working…",
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    // Each open starts without the previous attempt's error — reset during
    // render, as an effect would paint the stale error for a frame first.
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setError(null);
    }

    const handleConfirm = async () => {
        setPending(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setPending(false);
        }
    };

    return (
        // Not dismissable mid-write: closing would hide the outcome.
        <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        Nothing was changed. {error}
                    </Alert>
                )}
                {children}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={pending} color="inherit">
                    Keep it
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={pending}
                    variant="contained"
                    color="error"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    {pending ? pendingLabel : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
