import PrivateDashboard from "@/components/Admin/PrivateDashboard";

/**
 * The Schedule tab: publish slots and see them on the calendar. The auth guard
 * and the team subscription run in AdminLayoutPage, above every admin screen.
 */
export default function AdminDashboardPage() {
  return <PrivateDashboard />;
}
