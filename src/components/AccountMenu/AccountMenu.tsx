import { useState, type MouseEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useFirebase, useSession } from "@/firebase";
import { ROUTES } from "@/Routes";

interface SignOutSource {
  doSignOut: () => Promise<void>;
}

const MENU_ID = "account-menu";

/**
 * The signed-in client's avatar, opening Appointments and Logout. Renders
 * nothing when nobody is signed in, so a header can include it
 * unconditionally.
 */
export default function AccountMenu() {
  const { user } = useSession();
  const firebase = useFirebase() as SignOutSource | null;
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const open = Boolean(anchor);
  const label = user.displayName || user.email || "Your account";
  const initial = label.charAt(0).toUpperCase();

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const handleClose = () => setAnchor(null);

  const handleSignOut = () => {
    handleClose();
    // Home first: signing out on the booking page would otherwise trip its
    // sign-in requirement and land on the sign-in screen instead.
    navigate(ROUTES.HOME);
    void firebase?.doSignOut();
  };

  return (
    <>
      {/* 1. Avatar */}
      <IconButton
        onClick={handleOpen}
        aria-label={`Account: ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? MENU_ID : undefined}
        sx={{ p: 0.5 }}
      >
        <Avatar
          src={user.photoURL ?? undefined}
          alt={label}
          // Google's photo host refuses some requests that carry a referrer.
          slotProps={{ img: { referrerPolicy: "no-referrer" } }}
          sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, bgcolor: "primary.main", color: "background.default" }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        id={MENU_ID}
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 240, maxWidth: "calc(100vw - 32px)", borderRadius: 3 } } }}
      >
        {/* 2. Who's signed in. A subheader, not a Box: the menu skips it for
            keyboard focus, so arrow keys start on Appointments. */}
        <ListSubheader disableSticky sx={{ lineHeight: 1.4, py: 1.25, bgcolor: "transparent" }}>
          <Typography noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
            {user.displayName || "Signed in"}
          </Typography>
          {user.email && (
            <Typography variant="caption" noWrap component="div" sx={{ color: "text.secondary" }}>
              {user.email}
            </Typography>
          )}
        </ListSubheader>
        <Divider />

        {/* 3. Actions */}
        <MenuItem component={RouterLink} to={ROUTES.APPOINTMENTS} onClick={handleClose} sx={{ minHeight: 44 }}>
          <ListItemIcon>
            <EventNoteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Appointments
        </MenuItem>
        <MenuItem onClick={handleSignOut} sx={{ minHeight: 44 }}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
