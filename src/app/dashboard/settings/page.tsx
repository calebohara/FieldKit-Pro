"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/subscription";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const { role, dailyUsage, loading } = useSubscription();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const planLabel = role === "pro" ? "Pro" : role === "admin" ? "Admin" : "Free";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-4 max-w-lg">
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="font-semibold mb-3">Account</h2>
          <div className="text-sm text-[var(--muted-foreground)] space-y-2">
            <p>
              <span className="text-[var(--foreground)]">Email:</span>{" "}
              {email ?? "Loading..."}
            </p>
            <p>
              <span className="text-[var(--foreground)]">Plan:</span>{" "}
              {loading ? "Loading..." : planLabel}
            </p>
          </div>
        </div>

        {role === "free" && (
          <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="font-semibold mb-3">Usage</h2>
            <div className="text-sm text-[var(--muted-foreground)] space-y-2">
              <p>
                <span className="text-[var(--foreground)]">Fault lookups today:</span>{" "}
                {dailyUsage} / 3
              </p>
              <p className="text-xs">
                Free plan includes 3 fault code lookups per day. Upgrade to Pro
                for unlimited access.
              </p>
            </div>
            <div className="mt-4">
              <span className="inline-block px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed min-h-11 leading-7">
                Upgrade to Pro — Coming Soon
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
