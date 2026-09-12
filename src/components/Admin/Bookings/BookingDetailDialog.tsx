import type { ReactNode } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    Stack,
    Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlineOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import type { Employee } from "@/components/calendar";
import { describeOwner } from "@/utils/employees";
import { formatDate, formatDuration, formatTime } from "@/utils/format";
import { minutesBetween, timeStatus } from "@/utils/timeframe";
import { ProfessionalTag, StatusChip } from "../AdminTable";
import type { Booking } from "./bookings";

export interface BookingDetailDialogProps {
    open: boolean;
    /** Kept after closing so the text doesn't blank while the dialog fades out. */
    booking: Booking | null;
    employees: Employee[];
    now: Date;
    onClose: () => void;
    onCancelBooking: (booking: Booking) => void;
}

const NO_VALUE = "—";

/** Everything the client gave when booking, with one-tap call and email. */
export default function BookingDetailDialog({
    open,
    booking,
    employees,
    now,
    onClose,
    onCancelBooking,
}: BookingDetailDialogProps) {
    if (!booking) return null;

    const status = timeStatus(booking.start, booking.end, now);
    // tel: wants digits (and a leading +) only; the stored number keeps the
    // client's own formatting for display.
    const dialable = booking.phone.replace(/[^\d+]/g, "");

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 800 }}>
                <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {booking.name || "Unnamed client"}
                </Box>
                <StatusChip status={status} />
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2.25}>
                    {/* 1. Appointment */}
                    <DetailRow icon={<EventOutlinedIcon />} label="When">
                        {formatDate(booking.start)} · {formatTime(booking.start)} – {formatTime(booking.end)} (
                        {formatDuration(minutesBetween(booking.start, booking.end))})
                    </DetailRow>
                    <DetailRow icon={<PersonOutlineIcon />} label="Professional">
                        <ProfessionalTag {...describeOwner(employees, booking.employeeId)} />
                    </DetailRow>

                    {/* 2. Contact */}
                    <DetailRow icon={<MailOutlineIcon />} label="Email">
                        {booking.email ? <Link href={`mailto:${booking.email}`}>{booking.email}</Link> : NO_VALUE}
                    </DetailRow>
                    <DetailRow icon={<PhoneOutlinedIcon />} label="Phone">
                        {dialable ? <Link href={`tel:${dialable}`}>{booking.phone}</Link> : NO_VALUE}
                    </DetailRow>

                    {/* 3. What they asked for */}
                    {booking.services.length > 0 && (
                        <DetailRow icon={<SpaOutlinedIcon />} label="Services">
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                {booking.services.map((service, index) => (
                                    <Chip key={`${service}-${index}`} size="small" label={service} />
                                ))}
                            </Box>
                        </DetailRow>
                    )}
                    {booking.message && (
                        <DetailRow icon={<ChatBubbleOutlineIcon />} label="Message">
                            <Box component="span" sx={{ whiteSpace: "pre-wrap" }}>
                                {booking.message}
                            </Box>
                        </DetailRow>
                    )}
                </Stack>
            </DialogContent>

            {/* 4. Actions */}
            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                {/* A past booking is history, not something to cancel. */}
                <Button
                    color="error"
                    variant="outlined"
                    startIcon={<EventBusyOutlinedIcon />}
                    disabled={status === "past"}
                    onClick={() => onCancelBooking(booking)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    Cancel booking
                </Button>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "24px 1fr", columnGap: 1.5, alignItems: "start" }}>
            <Box sx={{ color: "text.secondary", display: "flex", pt: 0.25 }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontWeight: 600 }}>
                    {label}
                </Typography>
                <Typography variant="body2" component="div" sx={{ overflowWrap: "anywhere" }}>
                    {children}
                </Typography>
            </Box>
        </Box>
    );
}
