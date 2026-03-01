import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPCL Command Reference — FieldKit Pro",
};

export default function PPCLReferencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Command Reference</h1>
      <p className="text-[var(--muted-foreground)]">
        Searchable command reference coming in v0.2.0.
      </p>
    </div>
  );
}
