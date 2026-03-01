"use client";

import { useState, useEffect, useRef } from "react";
import SearchableTable from "./SearchableTable";
import { yaskawaFaults } from "@/lib/data/yaskawa-faults";
import { yaskawaParameters } from "@/lib/data/yaskawa-parameters";
import { PaidFeatureGate, useSubscription } from "@/lib/subscription";

type Tab = "faults" | "parameters" | "configs";

const faultColumns = [
  { key: "code" as const, label: "Code", searchable: true },
  { key: "name" as const, label: "Name", searchable: true },
  { key: "description" as const, label: "Description", searchable: true },
  { key: "causes" as const, label: "Common Causes", searchable: true },
  { key: "remedy" as const, label: "Remedy", searchable: true },
];

const paramColumns = [
  { key: "parameter" as const, label: "Parameter", searchable: true },
  { key: "name" as const, label: "Name", searchable: true },
  { key: "description" as const, label: "Description", searchable: true },
  { key: "range" as const, label: "Range", searchable: false },
  { key: "defaultValue" as const, label: "Default", searchable: false },
];

interface CommonConfig {
  title: string;
  description: string;
  parameters: { param: string; value: string; note: string }[];
}

const commonConfigs: CommonConfig[] = [
  {
    title: "BACnet MS/TP Communication",
    description:
      "Standard BACnet MS/TP setup for building automation system integration.",
    parameters: [
      { param: "F6-01", value: "BACnet", note: "Communication protocol" },
      { param: "F6-02", value: "1-127", note: "Station address (unique on trunk)" },
      { param: "F6-03", value: "76800", note: "Baud rate (match all devices)" },
      { param: "F6-06", value: "5.0 s", note: "Communication timeout" },
      { param: "H5-11", value: "1-4194303", note: "BACnet instance number" },
      { param: "b1-02", value: "3", note: "Run command from communication" },
      { param: "b1-01", value: "3", note: "Frequency reference from communication" },
    ],
  },
  {
    title: "Modbus RTU Communication",
    description:
      "Modbus RTU serial communication for DDC controller integration.",
    parameters: [
      { param: "F6-01", value: "Modbus RTU", note: "Communication protocol" },
      { param: "F6-02", value: "1-247", note: "Station address" },
      { param: "F6-03", value: "19200", note: "Baud rate" },
      { param: "F6-04", value: "Even", note: "Parity setting" },
      { param: "F6-06", value: "5.0 s", note: "Communication timeout" },
    ],
  },
  {
    title: "AHU Supply Fan (Constant Volume)",
    description:
      "Basic constant-volume AHU supply fan with hand/auto control.",
    parameters: [
      { param: "E2-04", value: "Motor V", note: "Motor rated voltage from nameplate" },
      { param: "E1-09", value: "Motor FLA", note: "Motor rated current from nameplate" },
      { param: "E1-04", value: "60 Hz", note: "Maximum output frequency" },
      { param: "C1-01", value: "30 s", note: "Acceleration time" },
      { param: "C1-02", value: "30 s", note: "Deceleration time" },
      { param: "b1-02", value: "1", note: "Run from terminal (DI)" },
      { param: "H1-01", value: "0", note: "S1 = Forward run" },
    ],
  },
  {
    title: "AHU Supply Fan (VAV with PID)",
    description:
      "Variable air volume fan with built-in PID for duct static pressure control.",
    parameters: [
      { param: "b5-01", value: "1", note: "PID enabled" },
      { param: "b5-05", value: "1.0 in. wc", note: "Duct static pressure setpoint" },
      { param: "b5-02", value: "2.0", note: "PID proportional gain" },
      { param: "b5-03", value: "10 s", note: "PID integration time" },
      { param: "b5-06", value: "AI1", note: "Pressure transducer feedback" },
      { param: "H3-01", value: "0-10V", note: "AI1 signal level" },
      { param: "E1-04", value: "60 Hz", note: "Maximum output frequency" },
      { param: "E1-06", value: "20 Hz", note: "Minimum frequency (prevent stall)" },
    ],
  },
  {
    title: "Cooling Tower Fan",
    description:
      "Cooling tower fan driven by BAS analog output speed reference.",
    parameters: [
      { param: "b1-01", value: "2", note: "Frequency ref from AI1" },
      { param: "H3-01", value: "0-10V", note: "AI1 signal level from BAS" },
      { param: "E1-04", value: "60 Hz", note: "Maximum output frequency" },
      { param: "E1-06", value: "12 Hz", note: "Minimum frequency" },
      { param: "C1-01", value: "60 s", note: "Accel time (slow for large fans)" },
      { param: "C1-02", value: "90 s", note: "Decel time (coast down)" },
      { param: "H1-01", value: "0", note: "S1 = Enable from BAS" },
    ],
  },
  {
    title: "Chilled/Hot Water Pump",
    description:
      "Secondary pump with built-in PID for differential pressure control.",
    parameters: [
      { param: "b5-01", value: "1", note: "PID enabled" },
      { param: "b5-05", value: "15 psi", note: "DP setpoint (adjust per system)" },
      { param: "b5-02", value: "1.5", note: "PID proportional gain" },
      { param: "b5-03", value: "15 s", note: "PID integration time" },
      { param: "b5-06", value: "AI1", note: "DP transducer feedback" },
      { param: "E1-06", value: "25 Hz", note: "Minimum frequency (prevent deadhead)" },
      { param: "C1-01", value: "20 s", note: "Acceleration time" },
      { param: "C1-02", value: "20 s", note: "Deceleration time" },
    ],
  },
];

export default function YaskawaDriveTools() {
  const [tab, setTab] = useState<Tab>("faults");
  const { recordUsage } = useSubscription();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      recordUsage("yaskawa-faults");
    }
  }, [recordUsage]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--card)] border border-[var(--border)] w-fit">
        {(
          [
            { id: "faults", label: "Fault Codes" },
            { id: "parameters", label: "Parameters" },
            { id: "configs", label: "Common Configs" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-11 ${
              tab === t.id
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fault Codes Tab */}
      {tab === "faults" && (
        <PaidFeatureGate toolName="yaskawa-faults">
          <SearchableTable
            data={yaskawaFaults}
            columns={faultColumns}
            categoryKey="category"
            categoryLabel="Categories"
            searchPlaceholder="Search fault codes, names, or descriptions..."
          />
        </PaidFeatureGate>
      )}

      {/* Parameters Tab */}
      {tab === "parameters" && (
        <PaidFeatureGate toolName="yaskawa-parameters">
          <SearchableTable
            data={yaskawaParameters}
            columns={paramColumns}
            categoryKey="group"
            categoryLabel="Groups"
            searchPlaceholder="Search parameters..."
          />
        </PaidFeatureGate>
      )}

      {/* Common Configs Tab */}
      {tab === "configs" && (
        <div className="space-y-6">
          {commonConfigs.map((config) => (
            <div
              key={config.title}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {config.description}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--accent)]/30">
                      <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">
                        Parameter
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">
                        Value
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.parameters.map((p) => (
                      <tr
                        key={p.param}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-2 font-mono text-[var(--primary)]">
                          {p.param}
                        </td>
                        <td className="px-4 py-2">{p.value}</td>
                        <td className="px-4 py-2 text-[var(--muted-foreground)]">
                          {p.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
