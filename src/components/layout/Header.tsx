"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useJobReport } from "@/lib/job-report";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const router = useRouter();
  const { entries } = useJobReport();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)] md:px-6 md:sticky md:top-0 md:z-20"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}
    >
      <h2 className="text-lg font-semibold md:hidden flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
        </svg>
        <span>
          <span className="text-[var(--primary)]">FieldKit</span> Pro
        </span>
      </h2>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/dashboard/reports"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] hover:bg-[var(--accent)] transition-all duration-200"
        >
          Reports
          {entries.length > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium rounded-full text-[var(--primary)]"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
            >
              {entries.length}
            </span>
          )}
        </Link>
        <button
          onClick={handleSignOut}
          className="px-2 py-1.5 text-sm rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200"
          aria-label="Sign out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
