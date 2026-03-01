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
      <h2 className="text-lg font-semibold md:hidden">
        <span className="text-[var(--primary)]">FieldKit</span> Pro
      </h2>
      <div className="ml-auto">
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
