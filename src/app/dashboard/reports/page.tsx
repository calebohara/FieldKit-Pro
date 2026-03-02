import type { Metadata } from "next";
import JobReportBuilder from "@/components/reports/JobReportBuilder";

export const metadata: Metadata = {
  title: "Job Reports — FieldKit Pro",
  description:
    "Capture field findings and export/share service reports with faults, parameter changes, PID values, and notes.",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Job Report Builder</h1>
      <JobReportBuilder />
    </div>
  );
}
