"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─── SVG Icon Components (20×20, stroke-based) ─── */

function IconHome({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconGuide({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconReports({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconPPCL({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14.5" y1="4" x2="9.5" y2="20" />
    </svg>
  );
}

function IconTuning({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconDrives({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconBACnet({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconPsych({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function IconUnits({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconSettings({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconMore({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

/* ─── Icon Map ─── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: IconHome,
  guide: IconGuide,
  reports: IconReports,
  ppcl: IconPPCL,
  tuning: IconTuning,
  drives: IconDrives,
  bacnet: IconBACnet,
  psych: IconPsych,
  units: IconUnits,
  settings: IconSettings,
  more: IconMore,
};

/* ─── Navigation items ─── */
const allNavItems = [
  { href: "/dashboard", label: "Home", iconKey: "home" },
  { href: "/dashboard/troubleshooting", label: "Guide", iconKey: "guide" },
  { href: "/dashboard/reports", label: "Reports", iconKey: "reports" },
  { href: "/dashboard/ppcl", label: "PPCL", iconKey: "ppcl" },
  { href: "/dashboard/loop-tuning", label: "Tuning", iconKey: "tuning" },
  { href: "/dashboard/drives/abb", label: "Drives", iconKey: "drives" },
  { href: "/dashboard/bacnet", label: "BACnet", iconKey: "bacnet" },
  // ─── overflow items ───
  { href: "/dashboard/psychrometrics", label: "Psych", iconKey: "psych" },
  { href: "/dashboard/conversions", label: "Units", iconKey: "units" },
  { href: "/dashboard/settings", label: "Settings", iconKey: "settings" },
];

const PRIMARY_COUNT = 4;
const primaryItems = allNavItems.slice(0, PRIMARY_COUNT);
const overflowItems = allNavItems.slice(PRIMARY_COUNT);

/* ─── Helper ─── */
function isNavActive(href: string, pathname: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

/* ─── Tab Item ─── */
function TabItem({
  href,
  label,
  iconKey,
  isActive,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  iconKey: string;
  isActive: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const Icon = ICON_MAP[iconKey] || IconHome;
  const content = (
    <>
      <span className="mobile-tab-icon-wrap">
        {isActive && <span className="mobile-tab-active-bg" />}
        <Icon
          className={`relative z-10 transition-colors duration-200 ${
            isActive
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)]"
          }`}
        />
        {badge != null && badge > 0 && (
          <span className="mobile-tab-badge">{badge > 99 ? "99+" : badge}</span>
        )}
      </span>
      <span
        className={`text-[11px] leading-none mt-1 transition-colors duration-200 ${
          isActive
            ? "font-semibold text-[var(--primary)]"
            : "font-medium text-[var(--muted-foreground)]"
        }`}
      >
        {label}
      </span>
    </>
  );

  const cls = `mobile-tab-item${isActive ? " mobile-tab-active" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} data-no-lift>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={cls} data-no-lift>
      {content}
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
        className={`md:hidden fixed left-3 right-3 z-[60] transition-all duration-300 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        }`}
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
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
            <p className="px-3 py-2 text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--muted-foreground)]">
              More Tools
            </p>
            {items.map((item) => {
              const isActive = isNavActive(item.href, pathname);
              const Icon = ICON_MAP[item.iconKey] || IconHome;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="more-sheet-item"
                  data-active={isActive || undefined}
                  data-no-lift
                >
                  <span className="more-sheet-icon-wrap" data-active={isActive || undefined}>
                    <Icon className={isActive ? "text-[var(--primary)]" : "text-[var(--foreground)]"} />
                  </span>
                  <span
                    className={`text-[13px] ${isActive ? "font-semibold text-[var(--primary)]" : "font-medium text-[var(--foreground)]"}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                      Active
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

  const activeInOverflow = overflowItems.some((item) =>
    isNavActive(item.href, pathname)
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
        className="mobile-bottom-nav md:hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mobile-bottom-nav-inner">
          {primaryItems.map((item) => {
            const isActive = isNavActive(item.href, pathname);
            return (
              <TabItem
                key={item.href}
                href={item.href}
                label={item.label}
                iconKey={item.iconKey}
                isActive={isActive}
              />
            );
          })}
          <TabItem
            href="#"
            label="More"
            iconKey="more"
            isActive={moreOpen || activeInOverflow}
            onClick={() => setMoreOpen((o) => !o)}
          />
        </div>
      </nav>
    </>
  );
}
