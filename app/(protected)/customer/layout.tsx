import { RoleGate } from "@/components/auth/role-gate";
import { AppShell } from "@/components/layout/app-shell";

const customerSidebar = [
  { href: "/restaurants", label: "Restaurants" },
  { href: "/customer/cart", label: "Cart" },
  { href: "/customer/checkout", label: "Checkout" },
  { href: "/customer/orders", label: "Order history" },
  { href: "/customer/profile", label: "Profile" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["CUSTOMER"]}>
      <AppShell sidebarTitle="Customer" sidebarItems={customerSidebar}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
