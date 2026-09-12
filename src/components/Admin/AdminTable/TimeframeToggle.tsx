import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { TIMEFRAME_LABELS, type TimeframeFilter } from "@/utils/timeframe";

export interface TimeframeToggleProps {
    value: TimeframeFilter;
    onChange: (value: TimeframeFilter) => void;
    /** Row count per option, shown beside its label. */
    counts?: Record<TimeframeFilter, number>;
}

const OPTIONS: TimeframeFilter[] = ["upcoming", "today", "past", "all"];

/** Upcoming / Today / Past / All, each with how many rows it holds. */
export default function TimeframeToggle({ value, onChange, counts }: TimeframeToggleProps) {
    return (
        <ToggleButtonGroup
            exclusive
            size="small"
            value={value}
            // A second click on the active option would clear it (null); ignore
            // that so there's always a timeframe applied.
            onChange={(_, next: TimeframeFilter | null) => next && onChange(next)}
            aria-label="Timeframe"
            // Four labelled counts are about a phone's width; tighter padding
            // fits them, and scrolling is the fallback on the narrowest screens.
            sx={{ maxWidth: "100%", overflowX: "auto", scrollbarWidth: "none" }}
        >
            {OPTIONS.map((option) => (
                <ToggleButton
                    key={option}
                    value={option}
                    sx={{
                        px: { xs: 1, sm: 1.75 },
                        gap: { xs: 0.75, sm: 1 },
                        flexShrink: 0,
                        textTransform: "none",
                        fontWeight: 600,
                    }}
                >
                    {TIMEFRAME_LABELS[option]}
                    {counts && (
                        <Box
                            component="span"
                            sx={{
                                minWidth: { xs: 18, sm: 22 },
                                px: { xs: 0.5, sm: 0.75 },
                                borderRadius: 5,
                                fontSize: 12,
                                lineHeight: "20px",
                                bgcolor: "action.selected",
                                color: "text.secondary",
                            }}
                        >
                            {counts[option]}
                        </Box>
                    )}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}
