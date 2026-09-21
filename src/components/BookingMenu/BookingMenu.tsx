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
import useMediaQuery from "@mui/material/useMediaQuery";
import ClearIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import ClientLogin from "@/components/ClientLogin";
import type { CatalogGroup, CatalogService } from "@/data";
import { SESSION_STATUS, useSession } from "@/firebase";
import {
  addServiceForAppointment,
  removeServiceForAppointment,
  selectCart,
  selectCatalogLoaded,
  selectMenu,
} from "@/redux";
import CartFab from "./CartFab";
import CartSummary from "./CartSummary";
import ServiceRow from "./ServiceRow";
import { countMatches, countServices, filterCatalog } from "./catalogSearch";
import { toCartLine, type CartLine } from "./cart";

export interface BookingMenuProps {
  /** Called when the cart's "Choose a time" button is pressed. */
  onContinue: () => void;
  /** The sign-in page, set to return to the menu. */
  signInPath: string;
}

// Wide enough for the cart (or sign-in) to sit beside the menu. At 1024px and
// under — tablets included — a floating button stands in for that column.
// Deliberately not MUI's `md` (900px): a 1024px tablet in landscape would get
// a column too narrow for the sign-in form.
const SIDEBAR_QUERY = "(min-width:1025px)";

/**
 * The service menu, open to everyone so prices can be read before signing in.
 * Adding to the cart needs a session: signed out, the Add buttons are off and
 * the cart's place — the side column, or the floating button — offers
 * sign-in instead.
 */
export default function BookingMenu({ onContinue, signInPath }: BookingMenuProps) {
  const dispatch = useDispatch();
  const { status } = useSession();
  const signedIn = status === SESSION_STATUS.SIGNED_IN;
  // Read synchronously on first render, so desktop never paints the phone layout first.
  const wide = useMediaQuery(SIDEBAR_QUERY, { noSsr: true });
  const cart: CartLine[] = useSelector(selectCart);
  const menu: CatalogGroup[] = useSelector(selectMenu);
  const loaded: boolean = useSelector(selectCatalogLoaded);
  // null = nothing chosen yet, which opens the first category — the menu
  // arrives from the database after the first render, so its first id can't
  // be the initial state.
  const [openCategory, setOpenCategory] = useState<string | false | null>(null);
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const categories = useMemo(() => filterCatalog(menu, query), [menu, query]);
  const expandedCategory = openCategory ?? menu[0]?.id ?? false;
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
        disabled={!signedIn}
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

  // The emailed sign-in link opens the sign-in page, not this one: only that
  // page is sure to be showing the form that finishes the sign-in.
  const returnUrl = new URL(signInPath, window.location.origin).href;

  return (
    <>
      <Grid container spacing={{ xs: 3, md: 5 }} sx={{ width: "100%", alignItems: "flex-start" }}>
        {/* 1. The menu — with room at the bottom for the floating button when there is one */}
        <Grid size={wide ? 8 : 12} sx={{ minWidth: 0, pb: wide ? 0 : 10 }}>
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

          {/* Before the first delivery, and if the menu is ever emptied out in the admin. */}
          {!loaded && (
            <Typography variant="body2" sx={{ color: "text.secondary", py: 3 }}>
              Loading the menu…
            </Typography>
          )}
          {loaded && menu.length === 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary", py: 3 }}>
              The menu isn&apos;t available right now. Please check back soon.
            </Typography>
          )}

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
                expanded={searching || expandedCategory === category.id}
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

        {/* 2. The cart — or, until they sign in, the way to */}
        {wide && (
          <Grid size={4} sx={{ minWidth: 0 }}>
            <Box sx={{ position: "sticky", top: 104 }}>
              {status === SESSION_STATUS.SIGNED_IN && <CartSummary onContinue={onContinue} />}
              {status === SESSION_STATUS.SIGNED_OUT && <ClientLogin returnUrl={returnUrl} headingComponent="h2" />}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* 3. Tablets and phones: the same, as a floating button. Held back
          while the session is still being checked, so it never flashes the wrong one. */}
      {!wide && status !== SESSION_STATUS.CHECKING && (
        <CartFab signedIn={signedIn} signInPath={signInPath} onContinue={onContinue} />
      )}
    </>
  );
}
