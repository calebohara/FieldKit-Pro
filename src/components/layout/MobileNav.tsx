"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

/* ─── Lazy-load WebGL glass (client only, no SSR) ─── */
const GlassNav = dynamic(() => import("@/components/glass/GlassNav"), {
  ssr: false,
});

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
  }, []);
  return platform;
}

/* ─── iOS Liquid Glass Nav Item ─── */
function GlassNavItem({
  href,
  label,
  icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2 px-2 min-w-[3.2rem] rounded-2xl transition-all duration-300 ${
        isActive
          ? "text-white"
          : "text-white/60 active:scale-95"
      }`}
    >
      {/* Active sub-pill — concave glass depression */}
      {isActive && (
        <span className="absolute inset-0 rounded-2xl liquid-glass-active" />
      )}
      <span
        className={`text-[18px] mb-0.5 relative z-10 transition-transform duration-200 ${
          isActive ? "scale-110" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[9px] tracking-wide relative z-10 ${
          isActive ? "font-semibold" : "font-normal"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── iOS Liquid Glass More Button ─── */
function GlassMoreButton({
  isActive,
  moreOpen,
  activeInOverflow,
  overflowIcon,
  overflowLabel,
  onClick,
}: {
  isActive: boolean;
  moreOpen: boolean;
  activeInOverflow: boolean;
  overflowIcon: string;
  overflowLabel: string;
  onClick: () => void;
}) {
  const showActive = moreOpen || activeInOverflow;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2 px-2 min-w-[3.2rem] rounded-2xl transition-all duration-300 ${
        showActive ? "text-white" : "text-white/60 active:scale-95"
      }`}
    >
      {showActive && (
        <span className="absolute inset-0 rounded-2xl liquid-glass-active" />
      )}
      <span
        className={`text-[18px] mb-0.5 relative z-10 transition-transform duration-300 ${
          moreOpen ? "rotate-45 scale-110" : ""
        }`}
      >
        {activeInOverflow && !moreOpen ? overflowIcon : "⋯"}
      </span>
      <span
        className={`text-[9px] tracking-wide relative z-10 ${
          showActive ? "font-semibold" : "font-normal"
        }`}
      >
        {activeInOverflow && !moreOpen ? overflowLabel : "More"}
      </span>
    </button>
  );
}

/* ─── Android Nav Item ─── */
function AndroidNavItem({
  href,
  label,
  icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
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
      {isActive && (
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
        className={`md:hidden fixed z-[60] transition-all duration-300 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        } ${
          platform === "ios"
            ? "left-4 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))]"
            : "left-3 right-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <div
          className={`rounded-2xl ${
            platform === "ios" ? "liquid-glass" : ""
          }`}
          style={
            platform === "ios"
              ? {
                  backdropFilter: "blur(40px) saturate(200%) brightness(1.05)",
                  WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.05)",
                }
              : {
                  background: "rgba(28, 28, 32, 0.97)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }
          }
        >
          <div className="p-2">
            <p
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium ${
                platform === "ios"
                  ? "text-white/40"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
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
                    platform === "ios"
                      ? isActive
                        ? "bg-white/10 text-white"
                        : "text-white/80 active:bg-white/5"
                      : isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--foreground)] active:bg-white/5"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className={`ml-auto text-xs ${
                        platform === "ios"
                          ? "text-white/50"
                          : "text-[var(--primary)]"
                      }`}
                    >
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

  // Find overflow item details for smart More button
  const activeOverflowItem = overflowItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );

  if (platform === "ios") {
    return (
      <>
        <MoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          items={overflowItems}
          pathname={pathname}
          platform={platform}
        />

        {/* iOS Liquid Glass floating pill nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[env(safe-area-inset-bottom)]"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          <div
            className="liquid-glass relative flex items-center justify-around py-1 px-1 rounded-[26px]"
            style={{
              backdropFilter: "blur(40px) saturate(200%) brightness(1.05)",
              WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.05)",
            }}
          >
            {/* WebGL refractive glass overlay */}
            <GlassNav ior={1.45} opacity={0.7} borderRadius={26} />
            {primaryItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <GlassNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                />
              );
            })}

            <GlassMoreButton
              isActive={moreOpen || activeInOverflow}
              moreOpen={moreOpen}
              activeInOverflow={activeInOverflow}
              overflowIcon={activeOverflowItem?.icon || "⋯"}
              overflowLabel={activeOverflowItem?.label || "More"}
              onClick={() => setMoreOpen((o) => !o)}
            />
          </div>
        </nav>
      </>
    );
  }

  // Android Material nav
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)]"
        style={{
          background: "rgba(18, 18, 22, 0.95)",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {primaryItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <AndroidNavItem
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
            className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[3.25rem] flex-1 text-[10px] tracking-wide transition-all duration-200 ${
              moreOpen || activeInOverflow
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)] active:scale-95"
            }`}
          >
            {(moreOpen || activeInOverflow) && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--primary)]/15" />
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
              className={`relative z-10 transition-colors duration-200 ${
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
