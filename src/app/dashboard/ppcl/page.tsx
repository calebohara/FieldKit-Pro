import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PPCL Tools — FieldKit Pro",
};

const sections = [
  {
    href: "/dashboard/ppcl/reference",
    title: "Command Reference",
    description: "Searchable reference of all PPCL commands with syntax and examples",
  },
  {
    href: "/dashboard/ppcl/errors",
    title: "Common Errors",
    description: "Symptoms, root causes, and fixes for frequent PPCL issues",
  },
  {
    href: "/dashboard/ppcl/analyzer",
    title: "Code Analyzer",
    description: "Paste PPCL code for syntax highlighting and issue detection",
  },
];

export default function PPCLPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Tools</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
          >
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
