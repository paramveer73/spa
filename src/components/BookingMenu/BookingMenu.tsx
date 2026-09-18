import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ClearIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { serviceCategories, type CatalogGroup, type CatalogService } from "@/data";
import { addServiceForAppointment, removeServiceForAppointment, selectCart } from "@/redux";
import CartSummary from "./CartSummary";
import ServiceRow from "./ServiceRow";
import { countMatches, countServices, filterCatalog } from "./catalogSearch";
import { toCartLine, type CartLine } from "./cart";

/** Opens on the studio's headline category rather than a blank list. */
const DEFAULT_OPEN = "pmu-brows";

export interface BookingMenuProps {
  /** Called when the cart's "Choose a time" button is pressed. */
  onContinue: () => void;
}

export default function BookingMenu({ onContinue }: BookingMenuProps) {
  const dispatch = useDispatch();
  const cart: CartLine[] = useSelector(selectCart);
  const [openCategory, setOpenCategory] = useState<string | false>(DEFAULT_OPEN);
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const categories = useMemo(() => filterCatalog(serviceCategories, query), [query]);
  const resultCount = useMemo(() => countMatches(categories), [categories]);

  const selectedIds = useMemo(() => new Set(cart.map((line) => line.id)), [cart]);

  const handleToggle = (service: CatalogService, categoryName: string) => {
    if (selectedIds.has(service.id)) {
      dispatch(removeServiceForAppointment({ id: service.id }));
      return;
    }
    // The slice takes an array and replaces same-id entries, so adding twice
    // updates in place instead of duplicating the line.
    dispatch(addServiceForAppointment([toCartLine(service, categoryName)]));
  };

  const renderServices = (services: CatalogService[] | undefined, categoryName: string) =>
    (services ?? []).map((service) => (
      <ServiceRow
        key={service.id}
        service={service}
        selected={selectedIds.has(service.id)}
        onToggle={(picked) => handleToggle(picked, categoryName)}
      />
    ));

  const renderGroup = (group: CatalogGroup, categoryName: string) => (
    <Box key={group.id} sx={{ mb: 2 }}>
      {/* Subcategory and add-on headings; the category's own name is on the accordion. */}
      {group.name !== categoryName && (
        <Typography
          variant="overline"
          sx={{ display: "block", color: "text.secondary", mt: 1 }}
        >
          {group.name}
        </Typography>
      )}
      {renderServices(group.services, categoryName)}
      {group.addOns && group.addOns.length > 0 && (
        <>
          <Typography variant="overline" sx={{ display: "block", color: "primary.main", mt: 2 }}>
            Add-ons
          </Typography>
          {renderServices(group.addOns, categoryName)}
        </>
      )}
      {(group.subcategories ?? []).map((sub) => renderGroup(sub, categoryName))}
    </Box>
  );

  return (
    <Grid container spacing={{ xs: 3, md: 5 }} sx={{ width: "100%", alignItems: "flex-start" }}>
      {/* 1. The menu */}
      <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search services"
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: searching ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => setQuery("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{ mb: 2 }}
        />

        {searching && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            {resultCount === 0
              ? `Nothing matches "${query.trim()}"`
              : `${resultCount} service${resultCount === 1 ? "" : "s"} match "${query.trim()}"`}
          </Typography>
        )}

        {categories.map((category) => {
          const picked = cart.filter((line) => line.categoryName === category.name).length;
          return (
            <Accordion
              key={category.id}
              expanded={searching || openCategory === category.id}
              onChange={(_, isOpen) => !searching && setOpenCategory(isOpen ? category.id : false)}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "transparent",
                borderBottom: 1,
                borderColor: "divider",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, pr: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, md: 17 } }}>
                    {category.name}
                  </Typography>
                  {picked > 0 && <Chip size="small" color="primary" label={picked} />}
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0 }}>
                    {countServices(category)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                {renderGroup(category, category.name)}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Grid>

      {/* 2. What's in the cart */}
      <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
        <CartSummary onContinue={onContinue} />
      </Grid>
    </Grid>
  );
}
