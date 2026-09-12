import { Box, Typography } from "@mui/material";
import { formatDate, formatDuration, formatTime } from "@/utils/format";
import { minutesBetween } from "@/utils/timeframe";

export interface WhenCellProps {
    start: Date;
    end: Date;
    /** Off where the table already has a length column. */
    showDuration?: boolean;
}

/** Date on top, time range (and length) beneath — the first column of both slot tables. */
export default function WhenCell({ start, end, showDuration = true }: WhenCellProps) {
    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.35 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: "inherit" }}>
                {formatDate(start)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: "inherit" }}>
                {formatTime(start)} – {formatTime(end)}
                {showDuration && ` · ${formatDuration(minutesBetween(start, end))}`}
            </Typography>
        </Box>
    );
}

/** The same moment as one line of text — for CSV export and the quick search. */
export function formatWhen(start: Date, end: Date): string {
    return `${formatDate(start)} ${formatTime(start)} – ${formatTime(end)}`;
}
