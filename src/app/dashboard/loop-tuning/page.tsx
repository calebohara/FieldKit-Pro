import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PID Loop Tuning — FieldKit Pro",
};

export default function LoopTuningPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PID Loop Tuning Calculator</h1>
      <p className="text-[var(--muted-foreground)]">
        Loop tuning calculator coming in v0.3.0.
      </p>
    </div>
  );
}
