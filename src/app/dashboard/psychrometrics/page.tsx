import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Psychrometrics — FieldKit Pro",
};

const Psychrometrics = dynamic(
  () => import("@/components/tools/Psychrometrics"),
  {
    loading: () => (
      <div className="text-[var(--muted-foreground)]">Loading calculator...</div>
    ),
  }
);

export default function PsychrometricsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Psychrometrics</h1>
      <Psychrometrics />
    </div>
  );
}
