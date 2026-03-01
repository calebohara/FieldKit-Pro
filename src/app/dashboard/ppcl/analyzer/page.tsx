"use client";

import dynamic from "next/dynamic";
import { PaidFeatureGate } from "@/lib/subscription";

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
      <PaidFeatureGate toolName="ppcl-analyzer">
        <PPCLAnalyzer />
      </PaidFeatureGate>
    </div>
  );
}
