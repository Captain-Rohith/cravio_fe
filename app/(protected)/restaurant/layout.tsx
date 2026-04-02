import { RoleGate } from "@/components/auth/role-gate";
import { AppShell } from "@/components/layout/app-shell";

const restaurantSidebar = [
  { href: "/restaurant", label: "Overview" },
  { href: "/restaurant/menu", label: "Menu management" },
  { href: "/restaurant/orders", label: "Order management" },
  { href: "/restaurant/location", label: "Location settings" },
  { href: "/restaurant/profile", label: "Profile" },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["RESTAURANT"]}>
      <AppShell sidebarTitle="Restaurant" sidebarItems={restaurantSidebar}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
