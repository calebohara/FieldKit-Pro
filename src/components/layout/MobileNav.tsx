"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─── All nav items ─── */
const allNavItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/ppcl", label: "PPCL", icon: "🔧" },
  { href: "/dashboard/loop-tuning", label: "Tuning", icon: "📊" },
  { href: "/dashboard/drives/abb", label: "Drives", icon: "⚡" },
  { href: "/dashboard/bacnet", label: "BACnet", icon: "🌐" },
  // ─── overflow items below ───
  { href: "/dashboard/psychrometrics", label: "Psych", icon: "🌡️" },
  { href: "/dashboard/conversions", label: "Units", icon: "🔄" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const PRIMARY_COUNT = 5;
const primaryItems = allNavItems.slice(0, PRIMARY_COUNT);
const overflowItems = allNavItems.slice(PRIMARY_COUNT);

/* ─── Platform detection ─── */
function usePlatform() {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setPlatform("android");
    }
    // Default to iOS style for iPhones, iPads, Macs, and desktops
  }, []);
  return platform;
}

/* ─── Nav Item ─── */
function NavItem({
  href,
  label,
  icon,
  isActive,
  platform,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  platform: "ios" | "android";
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[3.25rem] flex-1 text-[10px] tracking-wide transition-all duration-200 ${
        isActive
          ? "text-[var(--primary)]"
          : "text-[var(--muted-foreground)] active:scale-95"
      }`}
    >
      {/* iOS: glowing dot indicator */}
      {platform === "ios" && isActive && (
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]" />
      )}
      {/* Android: pill indicator behind icon */}
      {platform === "android" && isActive && (
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--primary)]/15" />
      )}
      <span
        className={`text-lg mb-0.5 transition-transform duration-200 relative z-10 ${
          isActive ? "scale-110" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`relative z-10 transition-colors duration-200 ${
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
  platform,
}: {
  open: boolean;
  onClose: () => void;
  items: typeof allNavItems;
  pathname: string;
  platform: "ios" | "android";
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
        style={{ background: "rgba(0,0,0,0.4)" }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`md:hidden fixed left-3 right-3 z-[60] transition-all duration-300 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        } ${
          platform === "ios"
            ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"
            : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <div
          className={`overflow-hidden ${
            platform === "ios"
              ? "rounded-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              : "rounded-xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          }`}
          style={
            platform === "ios"
              ? {
                  background: "rgba(30, 30, 40, 0.75)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                }
              : { background: "rgba(28, 28, 32, 0.97)" }
          }
        >
          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">
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
                      : "text-[var(--foreground)] active:bg-white/5"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
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
  const platform = usePlatform();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if active page is in overflow
  const activeInOverflow = overflowItems.some((item) =>
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
        platform={platform}
      />

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300 ${
          platform === "ios"
            ? "border-t border-white/[0.06]"
            : "border-t border-[var(--border)]"
        }`}
        style={
          platform === "ios"
            ? {
                background: "rgba(20, 20, 28, 0.55)",
                backdropFilter: "blur(28px) saturate(180%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%)",
              }
            : {
                background: "rgba(18, 18, 22, 0.95)",
                boxShadow: "0 -2px 16px rgba(0,0,0,0.3)",
              }
        }
      >
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
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
                platform={platform}
              />
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[3.25rem] flex-1 text-[10px] tracking-wide transition-all duration-200 ${
              moreOpen || activeInOverflow
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)] active:scale-95"
            }`}
          >
            {platform === "ios" && (moreOpen || activeInOverflow) && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]" />
            )}
            {platform === "android" && (moreOpen || activeInOverflow) && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--primary)]/15" />
            )}
            <span
              className={`text-lg mb-0.5 relative z-10 transition-transform duration-300 ${
                moreOpen ? "rotate-45 scale-110" : ""
              }`}
            >
              {activeInOverflow && !moreOpen
                ? overflowItems.find((item) =>
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  )?.icon || "⋯"
                : "⋯"}
            </span>
            <span
              className={`relative z-10 transition-colors duration-200 ${
                moreOpen || activeInOverflow ? "font-semibold" : "font-normal"
              }`}
            >
              {activeInOverflow && !moreOpen
                ? overflowItems.find((item) =>
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  )?.label || "More"
                : "More"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
