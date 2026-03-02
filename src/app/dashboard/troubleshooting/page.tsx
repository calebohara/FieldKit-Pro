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
      <h1 className="text-2xl font-bold">Drive Troubleshooter</h1>
      <DriveTroubleshooter />
    </div>
  );
}
