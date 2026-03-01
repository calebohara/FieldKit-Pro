import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ABB Drive Tools — FieldKit Pro",
};

export default function ABBDrivePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ABB Drive Tools</h1>
      <p className="text-[var(--muted-foreground)]">
        ABB fault codes and parameter reference coming in v0.4.0.
      </p>
    </div>
  );
}
