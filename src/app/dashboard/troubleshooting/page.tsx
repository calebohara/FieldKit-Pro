import type { Metadata } from "next";
import DriveTroubleshooter from "@/components/tools/DriveTroubleshooter";

export const metadata: Metadata = {
  title: "Drive Troubleshooter — FieldKit Pro",
  description:
    "Guided drive fault troubleshooting flow for ABB and Yaskawa drives.",
};

export default function DriveTroubleshootingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Drive Troubleshooter</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Guided diagnosis and recovery steps for common drive faults.
        </p>
      </div>
      <DriveTroubleshooter />
    </div>
  );
}
