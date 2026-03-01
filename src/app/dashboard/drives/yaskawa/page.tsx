import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yaskawa Drive Tools — FieldKit Pro",
};

export default function YaskawaDrivePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yaskawa Drive Tools</h1>
      <p className="text-[var(--muted-foreground)]">
        Yaskawa fault codes and parameter reference coming in v0.4.0.
      </p>
    </div>
  );
}
