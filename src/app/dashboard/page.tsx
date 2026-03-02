import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard — FieldKit Pro",
};

const tools = [
  {
    href: "/dashboard/troubleshooting",
    icon: "🧭",
    title: "Drive Troubleshooter",
    description: "Guided fault-to-fix flow with targeted parameter checks",
  },
  {
    href: "/dashboard/reports",
    icon: "📝",
    title: "Job Reports",
    description: "Save findings and export/share field service summaries",
  },
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
  {
    href: "/dashboard/psychrometrics",
    icon: "🌡️",
    title: "Psychrometrics",
    description: "Dewpoint, enthalpy, RH, and mixed air calculations",
  },
  {
    href: "/dashboard/conversions",
    icon: "🔄",
    title: "Unit Conversions",
    description: "kPa/inWC, CFM/L/s, RTD tables, and signal scaling",
  },
  {
    href: "/dashboard/bacnet",
    icon: "🌐",
    title: "BACnet/IP Tools",
    description: "Subnet calculator, gateway checks, and ping troubleshooter",
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Your Toolkit</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        {tools.map((tool) => (
          <Link
            key={tool.href}
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
    </div>
  );
}
