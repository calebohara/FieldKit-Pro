import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Unit Conversions — FieldKit Pro",
};

const UnitConverter = dynamic(
  () => import("@/components/tools/UnitConverter"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading converter...</div>
    ),
  }
);

export default function ConversionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Unit Conversions</h1>
      <UnitConverter />
    </div>
  );
}
