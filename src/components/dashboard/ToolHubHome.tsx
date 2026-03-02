"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSubscription } from "@/lib/subscription";
import { TOOL_CATALOG, useToolHub, type ToolPersona } from "@/lib/tool-hub";

interface QuickStartCard {
  id: ToolPersona;
  title: string;
  subtitle: string;
  steps: { label: string; toolId: string }[];
}

const quickStartCards: QuickStartCard[] = [
  {
    id: "startup-tech",
    title: "Startup Tech",
    subtitle: "Commission quickly and verify essentials.",
    steps: [
      { label: "Drive setup checks", toolId: "troubleshooting" },
      { label: "PID baseline values", toolId: "loop-tuning" },
      { label: "Capture startup report", toolId: "reports" },
    ],
  },
  {
    id: "bas-integrator",
    title: "BAS Integrator",
    subtitle: "Network and controls workflow.",
    steps: [
      { label: "BACnet diagnostics", toolId: "bacnet" },
      { label: "PPCL reference/analyzer", toolId: "ppcl" },
      { label: "Document parameter updates", toolId: "reports" },
    ],
  },
  {
    id: "service",
    title: "Service",
    subtitle: "Rapid fault isolation and handoff.",
    steps: [
      { label: "Fault-driven troubleshooting", toolId: "troubleshooting" },
      { label: "Manufacturer fault references", toolId: "abb" },
      { label: "Export service summary", toolId: "reports" },
    ],
  },
];

const defaultByPlan: Record<"free" | "pro" | "admin", ToolPersona> = {
  free: "startup-tech",
  pro: "bas-integrator",
  admin: "service",
};

function toolById(toolId: string) {
  return TOOL_CATALOG.find((tool) => tool.id === toolId);
}

export default function ToolHubHome() {
  const { role, loading } = useSubscription();
  const { persona, setPersona, pinnedToolIds, recentToolIds, isPinned, togglePin } =
    useToolHub();

  const effectivePersona = useMemo<ToolPersona>(() => {
    if (persona) return persona;
    if (loading) return "startup-tech";
    return defaultByPlan[role];
  }, [persona, role, loading]);

  const pinnedTools = useMemo(
    () =>
      pinnedToolIds
        .map((id) => toolById(id))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
    [pinnedToolIds]
  );

  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => toolById(id))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
    [recentToolIds]
  );

  const activeQuickStart = quickStartCards.find((card) => card.id === effectivePersona) ?? quickStartCards[0];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your Toolkit</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Personalized hub with pinned tools, recent tools, and quick starts.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <div>
          <h2 className="text-base font-semibold">Quick-Start Role</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Choose your current workflow focus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickStartCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setPersona(card.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium border min-h-11 ${
                effectivePersona === card.id
                  ? "bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[var(--accent)]"
              }`}
            >
              {card.title}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
          <h3 className="font-medium">{activeQuickStart.title}</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {activeQuickStart.subtitle}
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            {activeQuickStart.steps.map((step) => {
              const tool = toolById(step.toolId);
              if (!tool) return null;
              return (
                <Link
                  key={step.label}
                  href={tool.href}
                  className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:bg-[var(--accent)]"
                >
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Pinned Tools</h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            {pinnedTools.length} pinned
          </span>
        </div>
        {pinnedTools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
            Pin frequently used tools from the All Tools section.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pinnedTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="card-interactive p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] group"
              >
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="font-semibold text-base group-hover:text-[var(--primary)] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Tools</h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            Last {recentTools.length} visited
          </span>
        </div>
        {recentTools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
            Your recent tools will appear here after navigation.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="px-3 py-2 rounded-md bg-[var(--card)] border border-[var(--border)] text-sm hover:bg-[var(--accent)]"
              >
                {tool.icon} {tool.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">All Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {TOOL_CATALOG.map((tool) => (
            <article
              key={tool.id}
              className="relative p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] group card-interactive"
            >
              <button
                onClick={() => togglePin(tool.id)}
                aria-label={isPinned(tool.id) ? "Unpin tool" : "Pin tool"}
                className={`absolute top-3 right-3 text-lg h-9 w-9 rounded-full border flex items-center justify-center ${
                  isPinned(tool.id)
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {isPinned(tool.id) ? "★" : "☆"}
              </button>
              <Link href={tool.href} className="block pr-10">
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="font-semibold text-base group-hover:text-[var(--primary)] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
