import { Suspense } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLoader from "@/components/AppLoader";
import { FirebaseContext, SessionProvider, firebase } from "@/firebase";
import * as Pages from "@/pages";
import { store } from "@/redux";
import PageViewTracker from "@/PageViewTracker";
import { ROUTES } from "@/Routes";
import ScrollToTop from "@/ScrollToTop";
import { ColorModeProvider } from "@/theme";

/**
 * Composition root. App-wide providers are mounted here, once, and each route
 * renders a lazily-loaded page from src/pages. Pages compose components from
 * src/components; App itself renders no page content.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <FirebaseContext.Provider value={firebase}>
          <SessionProvider>
            <ColorModeProvider>
              <ScrollToTop />
              <PageViewTracker />
              <Suspense fallback={<AppLoader />}>
                <Routes>
                  <Route path={ROUTES.HOME} element={<Pages.HomePage />} />
                  <Route path={ROUTES.LOGIN} element={<Pages.LoginPage />} />
                  <Route path={ROUTES.CLIENT_LOGIN} element={<Pages.ClientLoginPage />} />
                  <Route path={ROUTES.BOOK} element={<Pages.BookingPage />} />
                  <Route path={ROUTES.APPOINTMENTS} element={<Pages.AppointmentsPage />} />
                  {/* Admin screens share one guarded frame; each child is its own chunk. */}
                  <Route path={ROUTES.ADMIN_DASHBOARD} element={<Pages.AdminLayoutPage />}>
                    <Route index element={<Pages.AdminDashboardPage />} />
                    <Route path={ROUTES.ADMIN_BOOKINGS} element={<Pages.AdminBookingsPage />} />
                    <Route path={ROUTES.ADMIN_SERVICES} element={<Pages.AdminServicesPage />} />
                    <Route path={ROUTES.ADMIN_TEAM} element={<Pages.AdminTeamPage />} />
                    <Route path="*" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                  </Route>
                  {/* Hosting rewrites every path to index.html, so unknown ones land here. */}
                  <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Routes>
              </Suspense>
            </ColorModeProvider>
          </SessionProvider>
        </FirebaseContext.Provider>
      </Provider>
    </BrowserRouter>
  );
}
