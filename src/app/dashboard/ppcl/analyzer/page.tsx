import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPCL Code Analyzer — FieldKit Pro",
};

export default function PPCLAnalyzerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Code Analyzer</h1>
      <p className="text-[var(--muted-foreground)]">
        Code analysis tool coming in v0.2.0.
      </p>
    </div>
  );
}
