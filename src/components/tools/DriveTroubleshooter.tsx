"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { abbFaults, type ABBFault } from "@/lib/data/abb-faults";
import { yaskawaFaults, type YaskawaFault } from "@/lib/data/yaskawa-faults";
import { abbParameters } from "@/lib/data/abb-parameters";
import { yaskawaParameters } from "@/lib/data/yaskawa-parameters";
import { useSubscription } from "@/lib/subscription";
import { useJobReport } from "@/lib/job-report";

type Brand = "abb" | "yaskawa";
type Fault = ABBFault | YaskawaFault;

const categoryChecks: Record<Brand, Record<string, string[]>> = {
  abb: {
    Overcurrent: ["01.07", "23.11", "99.06"],
    Overvoltage: ["01.08", "01.10", "01.05"],
    Temperature: ["30.15", "31.01", "99.06"],
    Hardware: ["31.22", "31.30", "95.01"],
    "Motor/Load": ["99.06", "99.04", "01.06"],
  },
  yaskawa: {
    Overcurrent: ["C1-01", "C1-02", "E2-01"],
    Overvoltage: ["C1-02", "L3-04", "E1-04"],
    Temperature: ["L8-05", "L8-55", "E2-01"],
    Hardware: ["L2-02", "L8-01", "H5-11"],
    "Motor/Load": ["E2-01", "E1-09", "b2-01"],
    "Ground Fault": ["L8-35", "L8-55", "E2-01"],
    External: ["H1-01", "H1-02", "H1-03"],
  },
};

const immediateActionsByCategory: Record<string, string[]> = {
  Overcurrent: [
    "Lock out power before megger or continuity tests on motor leads.",
    "Inspect motor/load for mechanical bind before forcing a restart.",
    "Increase accel/decel only after confirming no wiring fault exists.",
  ],
  Overvoltage: [
    "Do not repeat short-stop cycles until decel profile is corrected.",
    "Verify braking hardware is present/healthy before returning to service.",
  ],
  Temperature: [
    "Keep drive stopped until airflow and ambient conditions are corrected.",
    "Check cabinet filters/fans before resetting the trip.",
  ],
  Hardware: [
    "Perform isolation tests (drive disconnected from motor) before restart.",
    "Escalate to manufacturer support if the fault persists unloaded.",
  ],
  "Motor/Load": [
    "Confirm motor nameplate values before changing torque/protection limits.",
    "Inspect couplings, belts, dampers, and pump/fan load path physically.",
  ],
  "Ground Fault": [
    "Do not re-energize until insulation resistance checks are complete.",
    "Dry or replace moisture-damaged cables/terminations before restart.",
  ],
  External: [
    "Trace external interlock chain and identify originating device status.",
    "Verify DI logic before bypassing any safety or process interlocks.",
  ],
};

function getRecommendedParameters(brand: Brand, fault: Fault | null) {
  if (!fault) return [];
  const parameters = brand === "abb" ? abbParameters : yaskawaParameters;
  const checkIds = categoryChecks[brand][fault.category] ?? [];
  return checkIds
    .map((id) => parameters.find((param) => param.parameter === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function parseBulletList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DriveTroubleshooter() {
  const [brand, setBrand] = useState<Brand>("abb");
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const { recordUsage } = useSubscription();
  const { addEntry } = useJobReport();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      recordUsage("drive-troubleshooter");
    }
  }, [recordUsage]);

  useEffect(() => {
    setSelectedCode("");
    setQuery("");
  }, [brand]);

  const faults = brand === "abb" ? abbFaults : yaskawaFaults;

  const filteredFaults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return faults;
    return faults.filter((fault) => {
      return [fault.code, fault.name, fault.category, fault.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [faults, query]);

  const selectedFault =
    faults.find((fault) => fault.code === selectedCode) ?? null;

  const categoryActions = selectedFault
    ? immediateActionsByCategory[selectedFault.category] ?? [
        "Validate wiring and nameplate inputs before reset.",
        "Run unloaded verification before returning process load.",
      ]
    : [];

  const parameterChecks = getRecommendedParameters(brand, selectedFault);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Step 1
          </p>
          <h3 className="font-medium mt-1">Select drive family</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setBrand("abb")}
            className={`px-4 py-2.5 rounded-lg border min-h-11 text-sm font-medium transition-colors ${
              brand === "abb"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            ABB
          </button>
          <button
            onClick={() => setBrand("yaskawa")}
            className={`px-4 py-2.5 rounded-lg border min-h-11 text-sm font-medium transition-colors ${
              brand === "yaskawa"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            Yaskawa
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Step 2
          </p>
          <h3 className="font-medium mt-1">Find and select current fault</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Showing {filteredFaults.length} of {faults.length} {brand.toUpperCase()} fault codes.
          </p>
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${brand.toUpperCase()} fault code or name...`}
          className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFaults.map((fault) => (
            <button
              key={fault.code}
              onClick={() => setSelectedCode(fault.code)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                selectedCode === fault.code
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:bg-[var(--accent)]"
              }`}
            >
              <p className="font-semibold text-sm">
                {fault.code} - {fault.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {fault.category}
              </p>
            </button>
          ))}
        </div>
      </section>

      {selectedFault && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Step 3
            </p>
            <h3 className="font-medium mt-1">
              Action plan for {selectedFault.code} ({selectedFault.name})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
              <h4 className="font-medium">Fault context</h4>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
                {selectedFault.description}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
              <h4 className="font-medium">Immediate actions</h4>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted-foreground)]">
                {categoryActions.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h4 className="font-medium">Likely causes to verify</h4>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted-foreground)]">
                {parseBulletList(selectedFault.causes).map((cause) => (
                  <li key={cause}>• {cause}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h4 className="font-medium">Recommended recovery path</h4>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted-foreground)]">
                {parseBulletList(selectedFault.remedy).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4">
            <h4 className="font-medium">Parameter checks before reset</h4>
            {parameterChecks.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                No mapped parameters for this category yet. Use the reference
                tool to verify accel/decel, motor nameplate, and I/O mappings.
              </p>
            )}
            {parameterChecks.length > 0 && (
              <div className="mt-2 space-y-2">
                {parameterChecks.map((param) => (
                  <div
                    key={param.parameter}
                    className="rounded-md border border-[var(--border)] bg-[var(--accent)]/10 p-3"
                  >
                    <p className="font-mono text-sm text-[var(--primary)]">
                      {param.parameter} - {param.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {param.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  addEntry({
                    type: "fault",
                    title: `${brand.toUpperCase()} ${selectedFault.code} - ${selectedFault.name}`,
                    summary: selectedFault.description,
                    source: "Drive Troubleshooter",
                    fields: {
                      Category: selectedFault.category,
                      Causes: selectedFault.causes,
                      Remedy: selectedFault.remedy,
                      "Suggested Checks": parameterChecks
                        .map((param) => `${param.parameter} ${param.name}`)
                        .join(", "),
                    },
                  })
                }
                className="px-3 py-2 rounded-md border border-[var(--border)] text-sm font-medium min-h-11 inline-flex items-center hover:bg-[var(--accent)]"
              >
                Add fault plan to report
              </button>
              <Link
                href={
                  brand === "abb"
                    ? "/dashboard/drives/abb"
                    : "/dashboard/drives/yaskawa"
                }
                className="px-3 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium min-h-11 inline-flex items-center"
              >
                Open full {brand.toUpperCase()} reference
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
