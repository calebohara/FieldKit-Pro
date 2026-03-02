"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Navigation items ─── */
const allNavItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/troubleshooting", label: "Guide", icon: "🧭" },
  { href: "/dashboard/reports", label: "Reports", icon: "📝" },
  { href: "/dashboard/ppcl", label: "PPCL", icon: "🔧" },
  { href: "/dashboard/loop-tuning", label: "Tuning", icon: "📊" },
  { href: "/dashboard/drives/abb", label: "Drives", icon: "⚡" },
  { href: "/dashboard/bacnet", label: "BACnet", icon: "🌐" },
  // ─── overflow items ───
  { href: "/dashboard/psychrometrics", label: "Psych", icon: "🌡️" },
  { href: "/dashboard/conversions", label: "Units", icon: "🔄" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const PRIMARY_COUNT = 4;
const primaryItems = allNavItems.slice(0, PRIMARY_COUNT);
const overflowItems = allNavItems.slice(PRIMARY_COUNT);

/* ─── Nav Item ─── */
function NavItem({
  href,
  label,
  icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[3.25rem] flex-1 transition-all duration-200 ${
        isActive
          ? "text-[var(--primary)]"
          : "text-[var(--muted-foreground)] active:scale-95"
      }`}
    >
      {/* Active pill indicator */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 h-8 w-10 rounded-full bg-[var(--primary)]/12" />
      )}
      <span
        className={`text-lg mb-0.5 relative z-10 transition-transform duration-200 ${
          isActive ? "scale-110" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[10px] tracking-wide relative z-10 ${
          isActive ? "font-semibold" : "font-normal"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── More Sheet ─── */
function MoreSheet({
  open,
  onClose,
  items,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  items: typeof allNavItems;
  pathname: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`md:hidden fixed inset-0 z-[55] transition-opacity duration-200 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--overlay-backdrop)" }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`md:hidden fixed left-3 right-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[60] transition-all duration-300 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--sheet-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--sheet-shadow)",
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
          }}
        >
          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium text-[var(--muted-foreground)]">
              More Tools
            </p>
            {items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--foreground)] active:bg-[var(--accent)]"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs text-[var(--primary)]">
                      Current
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─── */
export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if active page is in overflow
  const activeInOverflow = overflowItems.some((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );

  // Find overflow item details for smart More button
  const activeOverflowItem = overflowItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );

  return (
    <>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={overflowItems}
        pathname={pathname}
      />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--mobile-nav-bg)",
          borderTop: "1px solid var(--mobile-nav-border)",
          boxShadow: "var(--mobile-nav-shadow)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        }}
      >
        <div className="flex items-center justify-around px-1">
          {primaryItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
              />
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[3.25rem] flex-1 transition-all duration-200 ${
              moreOpen || activeInOverflow
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)] active:scale-95"
            }`}
          >
            {(moreOpen || activeInOverflow) && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 h-8 w-10 rounded-full bg-[var(--primary)]/12" />
            )}
            <span
              className={`text-lg mb-0.5 relative z-10 transition-transform duration-300 ${
                moreOpen ? "rotate-45 scale-110" : ""
              }`}
            >
              {activeInOverflow && !moreOpen
                ? activeOverflowItem?.icon || "⋯"
                : "⋯"}
            </span>
            <span
              className={`text-[10px] tracking-wide relative z-10 ${
                moreOpen || activeInOverflow ? "font-semibold" : "font-normal"
              }`}
            >
              {activeInOverflow && !moreOpen
                ? activeOverflowItem?.label || "More"
                : "More"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
