import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "PID Loop Tuning — FieldKit Pro",
};

const PIDCalculator = dynamic(
  () => import("@/components/tools/PIDCalculator"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading calculator...</div>
    ),
  }
);

export default function LoopTuningPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PID Loop Tuning Calculator</h1>
      <PIDCalculator />
    </div>
  );
}
