import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "ABB Drive Tools — FieldKit Pro",
};

const ABBDriveTools = dynamic(
  () => import("@/components/tools/ABBDriveTools"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading drive tools...</div>
    ),
  }
);

export default function ABBDrivePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ABB Drive Tools</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        ACS580 / ACS880 fault codes, parameters, and common HVAC configurations.
      </p>
      <ABBDriveTools />
    </div>
  );
}
