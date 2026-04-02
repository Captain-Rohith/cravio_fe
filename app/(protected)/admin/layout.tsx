import { RoleGate } from "@/components/auth/role-gate";
import { AppShell } from "@/components/layout/app-shell";

const adminSidebar = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/restaurants", label: "Restaurant management" },
  { href: "/admin/restaurants/new", label: "Create restaurant" },
  { href: "/admin/orders", label: "Order operations" },
  { href: "/admin/profile", label: "Profile" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["ADMIN"]}>
      <AppShell sidebarTitle="Admin" sidebarItems={adminSidebar}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
