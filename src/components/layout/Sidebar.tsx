"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/ppcl", label: "PPCL", icon: "🔧" },
  { href: "/dashboard/loop-tuning", label: "Tuning", icon: "📊" },
  { href: "/dashboard/drives/abb", label: "ABB", icon: "⚡" },
  { href: "/dashboard/drives/yaskawa", label: "Yaskawa", icon: "⚡" },
  { href: "/dashboard/psychrometrics", label: "Psych", icon: "🌡️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-[var(--border)] bg-[var(--card)] min-h-screen">
      <div className="p-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
          </svg>
          <span>
            <span className="text-[var(--primary)]">FieldKit</span>{" "}
            <span className="text-[var(--foreground)]">Pro</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium min-h-11 transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-[var(--primary)]" />
              )}
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <a
          href="mailto:feedback@fieldkit.pro"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] min-h-11 transition-colors"
        >
          <span className="text-base">💬</span>
          Feedback
        </a>
      </div>
    </aside>
  );
}
