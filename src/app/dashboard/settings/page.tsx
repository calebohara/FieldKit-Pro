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
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-4 max-w-lg stagger-children">
        {/* Account Card */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Account
          </h2>
          <div className="text-sm space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Email</span>
              <span className="font-medium">{email ?? "Loading..."}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--muted-foreground)]">Plan</span>
              <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${
                role === "pro" || role === "admin"
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "bg-[var(--accent)] text-[var(--muted-foreground)]"
              }`}>
                {loading ? "..." : planLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Card */}
        {role === "free" && (
          <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="font-semibold mb-4">Daily Usage</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Fault lookups</span>
                <span className="font-medium tabular-nums">{dailyUsage} / 3</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min((dailyUsage / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Free plan includes 3 fault code lookups per day. Upgrade to Pro for unlimited access to all tools.
              </p>
              <button
                disabled
                className="w-full mt-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
              >
                Upgrade to Pro — Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
