"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] max-w-lg">
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="text-sm text-[var(--muted-foreground)]">
          <p>
            <span className="text-[var(--foreground)]">Email:</span>{" "}
            {email ?? "Loading..."}
          </p>
          <p className="mt-2">
            <span className="text-[var(--foreground)]">Plan:</span> Free
          </p>
        </div>
      </div>
    </div>
  );
}
