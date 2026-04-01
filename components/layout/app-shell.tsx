import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: ReactNode;
  sidebarTitle?: string;
  sidebarItems?: Array<{ href: string; label: string }>;
}

export function AppShell({ children, sidebarTitle, sidebarItems }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[auto_1fr] lg:px-6">
        {sidebarItems && sidebarTitle ? <Sidebar title={sidebarTitle} items={sidebarItems} /> : null}
        <section>{children}</section>
      </main>
    </div>
  );
}
