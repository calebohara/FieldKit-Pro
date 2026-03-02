"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "free" | "pro" | "admin";

interface SubscriptionContextType {
  role: Role;
  loading: boolean;
  dailyUsage: number;
  canUseTool: (toolName: string) => boolean;
  recordUsage: (toolName: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  role: "free",
  loading: true,
  dailyUsage: 0,
  canUseTool: () => true,
  recordUsage: async () => {},
});

// Tools that are always free
const FREE_TOOLS = ["ppcl-reference", "ppcl-errors", "pid-basic"];

// Tools that are rate-limited on free tier (3/day)
const RATE_LIMITED_TOOLS = [
  "abb-faults",
  "abb-parameters",
  "yaskawa-faults",
  "yaskawa-parameters",
];

// Tools that require pro
const PRO_ONLY_TOOLS = ["ppcl-analyzer"];

const FREE_DAILY_LIMIT = 3;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("free");
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function loadSubscription() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user role from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        setRole(profile.role as Role);
      }

      // Get today's usage count for rate-limited tools
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("tool_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      setDailyUsage(count ?? 0);
      setLoading(false);
    }

    loadSubscription();
  }, []);

  const canUseTool = useCallback(
    (_toolName: string) => {
      // TODO: Re-enable paywall before production launch
      // if (role === "pro" || role === "admin") return true;
      // if (FREE_TOOLS.includes(toolName)) return true;
      // if (PRO_ONLY_TOOLS.includes(toolName)) return false;
      // if (RATE_LIMITED_TOOLS.includes(toolName)) {
      //   return dailyUsage < FREE_DAILY_LIMIT;
      // }
      return true;
    },
    [role, dailyUsage]
  );

  const recordUsage = useCallback(async (toolName: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("tool_usage").insert({
      user_id: user.id,
      tool_name: toolName,
    });

    setDailyUsage((prev) => prev + 1);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ role, loading, dailyUsage, canUseTool, recordUsage }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function PaidFeatureGate({
  toolName,
  children,
  fallback,
}: {
  toolName: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canUseTool, loading, role, dailyUsage } = useSubscription();

  if (loading) {
    return (
      <div className="text-[var(--muted-foreground)]">Checking access...</div>
    );
  }

  if (canUseTool(toolName)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const isRateLimited = RATE_LIMITED_TOOLS.includes(toolName);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center max-w-md mx-auto mt-8">
      <div className="text-3xl mb-3">🔒</div>
      <h3 className="text-lg font-semibold mb-2">
        {isRateLimited ? "Daily Limit Reached" : "Pro Feature"}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        {isRateLimited
          ? `You've used ${dailyUsage}/${FREE_DAILY_LIMIT} free lookups today. Upgrade to Pro for unlimited access.`
          : "This tool requires a Pro subscription. Upgrade to unlock all features."}
      </p>
      <a
        href="/dashboard/settings"
        className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity min-h-11"
      >
        Upgrade to Pro
      </a>
      {role === "free" && (
        <p className="text-xs text-[var(--muted-foreground)] mt-3">
          Pro plans start at $5/mo
        </p>
      )}
    </div>
  );
}
