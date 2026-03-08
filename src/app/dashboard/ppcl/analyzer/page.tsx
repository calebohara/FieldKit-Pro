"use client";

import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const PPCLAnalyzer = dynamic(() => import("@/components/tools/PPCLAnalyzer"), {
  loading: () => <PageSkeleton cards={2} />,
  ssr: false,
});

export default function PPCLAnalyzerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Code Analyzer</h1>
      <PPCLAnalyzer />
    </div>
  );
}
