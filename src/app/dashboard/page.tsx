import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard — FieldKit Pro",
};

const tools = [
  {
    href: "/dashboard/ppcl",
    icon: "🔧",
    title: "PPCL Tools",
    description: "Command reference, error lookup, and code analyzer",
  },
  {
    href: "/dashboard/loop-tuning",
    icon: "📊",
    title: "PID Loop Tuning",
    description: "Calculate PID values for HVAC loops",
  },
  {
    href: "/dashboard/drives/abb",
    icon: "⚡",
    title: "ABB Drives",
    description: "Fault codes, parameters, and configurations",
  },
  {
    href: "/dashboard/drives/yaskawa",
    icon: "⚡",
    title: "Yaskawa Drives",
    description: "Fault codes, parameters, and setup guides",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Toolkit</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors group"
          >
            <div className="text-2xl mb-2">{tool.icon}</div>
            <h3 className="font-semibold group-hover:text-[var(--primary)] transition-colors">
              {tool.title}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
