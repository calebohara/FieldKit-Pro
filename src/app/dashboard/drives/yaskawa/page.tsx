import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Yaskawa Drive Tools — FieldKit Pro",
};

const YaskawaDriveTools = dynamic(
  () => import("@/components/tools/YaskawaDriveTools"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading drive tools...</div>
    ),
  }
);

export default function YaskawaDrivePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yaskawa Drive Tools</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        GA500 / GA700 fault codes, parameters, and common HVAC configurations.
      </p>
      <YaskawaDriveTools />
    </div>
  );
}
