/**
 * Every client-side path, in one place. Pages and components navigate with
 * ROUTES.X rather than string literals, so a path changes in exactly one line.
 */
export const ROUTES = {
  HOME: "/",
  // The staff sign-in (email + password). Clients use CLIENT_LOGIN.
  LOGIN: "/signin",
  CLIENT_LOGIN: "/login",
  BOOK: "/book",
  APPOINTMENTS: "/appointments",
  // The admin screens nest under ADMIN_DASHBOARD, which renders their shared
  // frame; the child paths must keep that prefix.
  ADMIN_DASHBOARD: "/admin",
  ADMIN_BOOKINGS: "/admin/bookings",
  ADMIN_SERVICES: "/admin/services",
  ADMIN_TEAM: "/admin/team",
} as const;
