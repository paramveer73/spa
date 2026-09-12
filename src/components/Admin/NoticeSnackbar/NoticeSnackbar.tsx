import { useState } from "react";
import { Alert, Snackbar, type AlertColor } from "@mui/material";

export interface Notice {
    severity: AlertColor;
    message: string;
}

export interface NoticeSnackbarProps {
    notice: Notice | null;
    onClose: () => void;
}

const AUTO_HIDE_MS = 4000;

/** Outcome of an admin action ("Booking cancelled"), replacing window.alert. */
export default function NoticeSnackbar({ notice, onClose }: NoticeSnackbarProps) {
    // Keeps showing the last notice while the snackbar slides out — clearing
    // `notice` closes it, and rendering null would blank it mid-animation.
    const [shown, setShown] = useState(notice);
    if (notice && notice !== shown) setShown(notice);

    return (
        <Snackbar
            open={notice !== null}
            autoHideDuration={AUTO_HIDE_MS}
            onClose={(_, reason) => reason !== "clickaway" && onClose()}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert severity={shown?.severity ?? "success"} variant="filled" onClose={onClose} sx={{ borderRadius: 2 }}>
                {shown?.message}
            </Alert>
        </Snackbar>
    );
}
