import type { ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Box, Button, Container, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { brand } from "@/data/brand";
import { ROUTES } from "@/Routes";

export interface AdminShellProps {
    children: ReactNode;
    onSignOut: () => void;
}

const ADMIN_TABS = [
    { label: "Schedule", to: ROUTES.ADMIN_DASHBOARD, icon: <CalendarMonthOutlinedIcon fontSize="small" /> },
    { label: "Bookings", to: ROUTES.ADMIN_BOOKINGS, icon: <EventAvailableOutlinedIcon fontSize="small" /> },
    { label: "Team", to: ROUTES.ADMIN_TEAM, icon: <GroupsOutlinedIcon fontSize="small" /> },
] as const;

/**
 * Frame around every admin screen: studio name, sign-out, and a tab per
 * screen. Tabs are links, so each screen has its own URL and Back works.
 */
export default function AdminShell({ children, onSignOut }: AdminShellProps) {
    const { pathname } = useLocation();
    // `false` is MUI's "no tab selected", for any path without a tab.
    const activeTab = ADMIN_TABS.find((tab) => tab.to === pathname)?.to ?? false;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            {/* 1. Top bar */}
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Toolbar sx={{ gap: 2 }}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                        {brand.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1.2 }}>
                        Admin
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button color="inherit" startIcon={<LogoutOutlinedIcon />} onClick={onSignOut} sx={{ textTransform: "none" }}>
                        Sign out
                    </Button>
                </Toolbar>

                {/* 2. Screens */}
                <Tabs
                    value={activeTab}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    aria-label="Admin screens"
                    sx={{ px: { xs: 1, sm: 2 }, minHeight: 44 }}
                >
                    {ADMIN_TABS.map((tab) => (
                        <Tab
                            key={tab.to}
                            value={tab.to}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            component={RouterLink}
                            to={tab.to}
                            sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }}
                        />
                    ))}
                </Tabs>
            </AppBar>

            {/* 3. Screen */}
            <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                {children}
            </Container>
        </Box>
    );
}
