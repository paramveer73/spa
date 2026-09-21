import { lazy } from "react";

// Each page is its own chunk, fetched the first time its route renders.
export const HomePage = lazy(() => import("./homePage"));
export const LoginPage = lazy(() => import("./loginPage"));
export const BookingPage = lazy(() => import("./bookingPage"));
export const ClientLoginPage = lazy(() => import("./clientLoginPage"));
export const AppointmentsPage = lazy(() => import("./appointmentsPage"));

// Admin: one layout (guard + shell) around a chunk per screen.
export const AdminLayoutPage = lazy(() => import("./adminLayoutPage"));
export const AdminDashboardPage = lazy(() => import("./adminDashboardPage"));
export const AdminBookingsPage = lazy(() => import("./adminBookingsPage"));
export const AdminServicesPage = lazy(() => import("./adminServicesPage"));
export const AdminTeamPage = lazy(() => import("./adminTeamPage"));
