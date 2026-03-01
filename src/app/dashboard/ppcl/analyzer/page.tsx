import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "PPCL Code Analyzer — FieldKit Pro",
};

const PPCLAnalyzer = dynamic(
  () => import("@/components/tools/PPCLAnalyzer"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading analyzer...</div>
    ),
  }
);

export default function PPCLAnalyzerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Code Analyzer</h1>
      <PPCLAnalyzer />
    </div>
  );
}
