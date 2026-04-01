"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
}

interface SidebarProps {
  title: string;
  items: SidebarItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:w-72">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {title}
      </h2>
      <nav aria-label={`${title} navigation`}>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[var(--color-brand)] text-white"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface)]",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
