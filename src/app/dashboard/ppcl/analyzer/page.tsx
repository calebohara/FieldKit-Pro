"use client";

import dynamic from "next/dynamic";

const PPCLAnalyzer = dynamic(
  () => import("@/components/tools/PPCLAnalyzer"),
  { ssr: false }
);

export default function PPCLAnalyzerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Code Analyzer</h1>
      <PPCLAnalyzer />
    </div>
  );
}
