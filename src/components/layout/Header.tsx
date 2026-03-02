"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)] md:px-6">
      <h2 className="text-lg font-semibold md:hidden flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
        </svg>
        <span>
          <span className="text-[var(--primary)]">FieldKit</span> Pro
        </span>
      </h2>
      <div className="ml-auto">
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
