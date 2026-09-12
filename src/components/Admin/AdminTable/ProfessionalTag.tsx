import { Box, Typography } from "@mui/material";

export interface ProfessionalTagProps {
    name: string;
    color?: string;
    /** No live employee record (unassigned or removed) — shown muted so it stands out as a gap. */
    missing?: boolean;
}

/**
 * A professional as the tables show them: their calendar colour, then their
 * name. Spread `describeOwner(employees, id)` straight into it.
 */
export default function ProfessionalTag({ name, color, missing = false }: ProfessionalTagProps) {
    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1, minWidth: 0, verticalAlign: "middle" }}>
            {/* 1. Colour dot — hollow when there's no colour to show */}
            <Box
                component="span"
                sx={{
                    width: 10,
                    height: 10,
                    flexShrink: 0,
                    borderRadius: "50%",
                    bgcolor: color ?? "transparent",
                    border: color ? 0 : 1.5,
                    borderColor: "text.disabled",
                }}
            />
            {/* 2. Name */}
            <Typography
                component="span"
                variant="body2"
                noWrap
                sx={{ color: missing ? "text.secondary" : "text.primary", fontStyle: missing ? "italic" : "normal" }}
            >
                {name}
            </Typography>
        </Box>
    );
}
