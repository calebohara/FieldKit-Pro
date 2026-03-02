"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/ppcl", label: "PPCL", icon: "🔧" },
  { href: "/dashboard/loop-tuning", label: "Tuning", icon: "📊" },
  { href: "/dashboard/drives/abb", label: "Drives", icon: "⚡" },
  { href: "/dashboard/psychrometrics", label: "Psych", icon: "🌡️" },
  { href: "/dashboard/conversions", label: "Units", icon: "🔄" },
  { href: "/dashboard/bacnet", label: "BACnet", icon: "🌐" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border)] nav-backdrop z-50">
      <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-2.5 px-3 min-h-[3.5rem] min-w-[3.5rem] text-xs transition-all duration-200 ${
                isActive
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] active:scale-95"
              }`}
            >
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
              <span className={`text-xl mb-0.5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className={`transition-colors duration-200 ${isActive ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
