import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export interface ScreenHeaderProps {
    title: string;
    description: string;
    /** A primary action on the right, e.g. "Add professional". */
    action?: ReactNode;
}

/** Title row for each admin screen, so the tabs all open the same way. */
export default function ScreenHeader({ title, description, action }: ScreenHeaderProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 640 }}>
                    {description}
                </Typography>
            </Box>
            {action}
        </Box>
    );
}
