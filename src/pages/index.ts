import { lazy } from "react";

// Each page is its own chunk, fetched the first time its route renders.
export const HomePage = lazy(() => import("./homePage"));
export const LoginPage = lazy(() => import("./loginPage"));

// Admin: one layout (guard + shell) around a chunk per screen.
export const AdminLayoutPage = lazy(() => import("./adminLayoutPage"));
export const AdminDashboardPage = lazy(() => import("./adminDashboardPage"));
export const AdminBookingsPage = lazy(() => import("./adminBookingsPage"));
export const AdminSlotsPage = lazy(() => import("./adminSlotsPage"));
export const AdminTeamPage = lazy(() => import("./adminTeamPage"));
