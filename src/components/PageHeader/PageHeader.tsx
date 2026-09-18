import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNew";
import AccountMenu from "@/components/AccountMenu";
import Wordmark from "@/components/Wordmark";
import { ROUTES } from "@/Routes";

/**
 * The slim header on pages outside the home page (booking, sign-in,
 * appointments): the wordmark, a way back, and the account avatar once
 * someone is signed in.
 */
export default function PageHeader() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 48 }}>
      {/* 1. Wordmark */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Wordmark size="md" />
      </Box>

      {/* 2. Back — the long label only where there's room beside the avatar */}
      <Button
        component={RouterLink}
        to={ROUTES.HOME}
        startIcon={<ArrowBackIcon sx={{ fontSize: 12 }} />}
        sx={{ color: "text.secondary", flexShrink: 0 }}
      >
        Back
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, whiteSpace: "pre" }}>
          {" to the studio"}
        </Box>
      </Button>

      {/* 3. Account */}
      <AccountMenu />
    </Box>
  );
}
