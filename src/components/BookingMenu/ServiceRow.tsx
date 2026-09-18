import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import type { CatalogService } from "@/data";
import { formatDuration, formatPrice } from "@/utils/format";

export interface ServiceRowProps {
  service: CatalogService;
  selected: boolean;
  onToggle: (service: CatalogService) => void;
}

/**
 * One line of the menu: what it is, what it costs, and a button that adds it
 * to the cart or takes it back out.
 *
 * The catalog's `note` field stays off the page — those are internal
 * "confirm with Kate" markers from the export, not customer copy.
 */
export default function ServiceRow({ service, selected, onToggle }: ServiceRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: { xs: 14, md: 15 } }}>{service.name}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatPrice(service.price)} · {formatDuration(service.duration)}
        </Typography>
      </Box>

      <Button
        onClick={() => onToggle(service)}
        size="small"
        variant={selected ? "contained" : "outlined"}
        startIcon={selected ? <CheckIcon /> : <AddIcon />}
        aria-label={`${selected ? "Remove" : "Add"} ${service.name}`}
        sx={{
          flexShrink: 0,
          minWidth: 104,
          borderColor: "divider",
          color: selected ? "background.default" : "text.primary",
          bgcolor: selected ? "text.primary" : "transparent",
          "&:hover": { bgcolor: selected ? "text.primary" : "action.hover", borderColor: "text.primary" },
        }}
      >
        {selected ? "Added" : "Add"}
      </Button>
    </Box>
  );
}
