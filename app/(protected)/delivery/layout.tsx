import { RoleGate } from "@/components/auth/role-gate";
import { AppShell } from "@/components/layout/app-shell";

const deliverySidebar = [
  { href: "/delivery/orders", label: "Assigned orders" },
  { href: "/delivery/tracking", label: "Location tracking" },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["DELIVERY_PARTNER"]}>
      <AppShell sidebarTitle="Delivery" sidebarItems={deliverySidebar}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
