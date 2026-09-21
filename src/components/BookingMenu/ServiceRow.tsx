import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { CatalogService } from "@/data";
import { formatDuration, formatPrice } from "@/utils/format";

export interface ServiceRowProps {
  service: CatalogService;
  selected: boolean;
  onToggle: (service: CatalogService) => void;
  /** Signed out: the price is readable, but nothing can be added until they sign in. */
  disabled?: boolean;
}

const SIGN_IN_HINT = "Sign in to add services";

// An added service's button, while the pointer (or keyboard focus) is on it:
// brand brown, and it says what a click will do — take it back out.
const OFFER_REMOVE = {
  bgcolor: "primary.main",
  borderColor: "primary.main",
  "& .service-added": { display: "none" },
  "& .service-remove": { display: "inline-flex" },
};

/**
 * One line of the menu: what it is, what it costs, and a button that adds it
 * to the cart or takes it back out.
 *
 * The catalog's `note` field stays off the page — those are internal
 * "confirm with Kate" markers from the export, not customer copy.
 */
export default function ServiceRow({ service, selected, onToggle, disabled = false }: ServiceRowProps) {
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

      {/* The span lets the hint show on a disabled button, which gets no pointer events of its own. */}
      <Tooltip title={disabled ? SIGN_IN_HINT : ""}>
        <Box component="span" sx={{ flexShrink: 0 }}>
          <Button
            onClick={() => onToggle(service)}
            disabled={disabled}
            size="small"
            variant={selected ? "contained" : "outlined"}
            startIcon={
              selected ? (
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <CheckIcon className="service-added" fontSize="inherit" />
                  <CloseIcon className="service-remove" fontSize="inherit" />
                </Box>
              ) : (
                <AddIcon />
              )
            }
            aria-label={disabled ? `${SIGN_IN_HINT}: ${service.name}` : `${selected ? "Remove" : "Add"} ${service.name}`}
            sx={{
              minWidth: 104,
              borderColor: "divider",
              color: selected ? "background.default" : "text.primary",
              bgcolor: selected ? "text.primary" : "transparent",
              "&:hover": { bgcolor: selected ? "text.primary" : "action.hover", borderColor: "text.primary" },
              "& .service-remove": { display: "none" },
              // Pointer devices only: on touch, the hover a tap leaves behind
              // would show "Remove" on a service that was just added.
              ...(selected && { "&.Mui-focusVisible": OFFER_REMOVE, "@media (hover: hover)": { "&:hover": OFFER_REMOVE } }),
            }}
          >
            {selected ? (
              <>
                <span className="service-added">Added</span>
                <span className="service-remove">Remove</span>
              </>
            ) : (
              "Add"
            )}
          </Button>
        </Box>
      </Tooltip>
    </Box>
  );
}
