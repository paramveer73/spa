import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { SIGN_IN_PHASE } from "./signInPhase";
import useClientSignIn from "./useClientSignIn";

export interface ClientLoginProps {
  /** Absolute URL the emailed link opens: the sign-in page, carrying where to go next. */
  returnUrl: string;
}

// 52px clears the 48px touch-target minimum with room for a thumb.
const ACTION_SX = { minHeight: 52, fontSize: 15 } as const;

/** Google's four-colour "G". Fixed colours: the mark isn't themed, in either mode. */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

/**
 * Client sign-in, phone-first: one column of full-width actions that reads
 * top to bottom with a thumb. From `sm` up it sits in a bordered card.
 *
 * Two ways in, neither with a password: Google, or a one-time link by email.
 */
export default function ClientLogin({ returnUrl }: ClientLoginProps) {
  const { phase, error, sentTo, signInWithGoogle, sendLink, completeWithEmail, startOver } =
    useClientSignIn(returnUrl);
  const [email, setEmail] = useState("");

  const busy = phase === SIGN_IN_PHASE.GOOGLE || phase === SIGN_IN_PHASE.SENDING;
  const confirming = phase === SIGN_IN_PHASE.NEEDS_EMAIL;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void (confirming ? completeWithEmail(email) : sendLink(email));
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 440,
        mx: "auto",
        p: { xs: 0, sm: 4 },
        border: { xs: 0, sm: 1 },
        borderColor: "divider",
        borderRadius: { sm: 4 },
        bgcolor: { sm: "background.paper" },
      }}
    >
      {/* 1. Signing in from the link */}
      {phase === SIGN_IN_PHASE.COMPLETING && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6 }}>
          <CircularProgress size={32} />
          <Typography sx={{ fontWeight: 700 }}>Signing you in…</Typography>
        </Box>
      )}

      {/* 2. Link sent — waiting on the inbox */}
      {phase === SIGN_IN_PHASE.LINK_SENT && (
        <>
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 32 }, fontWeight: 800, mt: 1.5 }}>
            Check your inbox
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1, mb: 3, overflowWrap: "anywhere" }}>
            We sent a sign-in link to{" "}
            <Box component="strong" sx={{ color: "text.primary" }}>
              {sentTo}
            </Box>
            . Open it on this device to continue — it works once.
          </Typography>
          <Button fullWidth variant="outlined" onClick={() => void sendLink(sentTo)} sx={ACTION_SX}>
            Send it again
          </Button>
          <Button fullWidth onClick={startOver} sx={{ ...ACTION_SX, mt: 1, color: "text.secondary" }}>
            Use a different email
          </Button>
        </>
      )}

      {/* 3. Choosing how to sign in */}
      {(phase === SIGN_IN_PHASE.IDLE || busy || confirming) && (
        <>
          <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 32 }, fontWeight: 800, lineHeight: 1.1 }}>
            {confirming ? "Confirm your email" : "Sign in to book"}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>
            {confirming
              ? "This link was opened in a different browser. Enter the email you sent it to."
              : "Use your Google account, or get a one-time sign-in link by email. No password needed."}
          </Typography>

          {!confirming && (
            <>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => void signInWithGoogle()}
                disabled={busy}
                startIcon={phase === SIGN_IN_PHASE.GOOGLE ? <CircularProgress size={18} /> : <GoogleMark />}
                sx={{ ...ACTION_SX, borderColor: "divider", color: "text.primary" }}
              >
                Continue with Google
              </Button>
              <Divider sx={{ my: 3, color: "text.secondary", fontSize: 13 }}>or</Divider>
            </>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus={confirming}
              disabled={busy}
              // The email keyboard on phones; 16px text (the default) keeps
              // iOS Safari from zooming the page when the field takes focus.
              slotProps={{ htmlInput: { inputMode: "email", autoCapitalize: "none", spellCheck: false } }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={busy}
              startIcon={phase === SIGN_IN_PHASE.SENDING ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                ...ACTION_SX,
                mt: 1.5,
                bgcolor: "text.primary",
                color: "background.default",
                "&:hover": { bgcolor: "text.primary" },
              }}
            >
              {confirming ? "Continue" : "Email me a sign-in link"}
            </Button>
          </Box>
        </>
      )}

      {/* 4. What went wrong */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
