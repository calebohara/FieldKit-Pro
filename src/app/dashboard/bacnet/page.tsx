import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "BACnet/IP Tools — FieldKit Pro",
};

const BACnetCalculator = dynamic(
  () => import("@/components/tools/BACnetCalculator"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading calculator...</div>
    ),
  }
);

export default function BACnetPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">BACnet/IP Tools</h1>
      <BACnetCalculator />
    </div>
  );
}
