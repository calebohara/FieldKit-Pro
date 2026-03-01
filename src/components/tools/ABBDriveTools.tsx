"use client";

import { useState, useEffect, useRef } from "react";
import SearchableTable from "./SearchableTable";
import { abbFaults } from "@/lib/data/abb-faults";
import { abbParameters } from "@/lib/data/abb-parameters";
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
      "Standard BACnet MS/TP setup for integration with building automation systems.",
    parameters: [
      { param: "58.01", value: "BACnet", note: "Protocol selection" },
      { param: "58.02", value: "1-127", note: "Station address (unique on trunk)" },
      { param: "58.03", value: "76800", note: "Baud rate (match all devices)" },
      { param: "58.05", value: "5.0 s", note: "Communication timeout" },
      { param: "02.01", value: "Communication", note: "Start command source" },
      { param: "01.01", value: "Communication", note: "Speed reference source" },
    ],
  },
  {
    title: "Modbus RTU Communication",
    description:
      "Modbus RTU serial communication for DDC controller integration.",
    parameters: [
      { param: "58.01", value: "Modbus RTU", note: "Protocol selection" },
      { param: "58.02", value: "1-247", note: "Station address" },
      { param: "58.03", value: "19200", note: "Baud rate" },
      { param: "58.04", value: "Even", note: "Parity" },
      { param: "58.05", value: "5.0 s", note: "Communication timeout" },
    ],
  },
  {
    title: "AHU Supply Fan (Constant Volume)",
    description:
      "Basic constant-volume AHU supply fan configuration with hand/auto control.",
    parameters: [
      { param: "99.04", value: "Motor RPM", note: "From motor nameplate" },
      { param: "99.06", value: "Motor FLA", note: "From motor nameplate" },
      { param: "01.05", value: "60 Hz", note: "Maximum frequency" },
      { param: "01.06", value: "0 Hz", note: "Minimum frequency" },
      { param: "01.07", value: "30 s", note: "Acceleration time" },
      { param: "01.08", value: "30 s", note: "Deceleration time" },
      { param: "02.01", value: "DI1", note: "Start/stop from BAS" },
    ],
  },
  {
    title: "AHU Supply Fan (VAV with PID)",
    description:
      "Variable air volume fan with built-in PID for duct static pressure control.",
    parameters: [
      { param: "40.01", value: "Enabled", note: "PID enable" },
      { param: "40.02", value: "1.0 in. wc", note: "Duct static setpoint" },
      { param: "40.03", value: "2.0", note: "PID proportional gain" },
      { param: "40.04", value: "10 s", note: "PID integration time" },
      { param: "40.06", value: "AI1", note: "Pressure transducer feedback" },
      { param: "12.01", value: "0-10V", note: "AI1 signal type" },
      { param: "01.05", value: "60 Hz", note: "Maximum frequency" },
      { param: "01.06", value: "20 Hz", note: "Minimum frequency (prevent stall)" },
    ],
  },
  {
    title: "Cooling Tower Fan",
    description:
      "Cooling tower fan with speed reference from BAS analog output.",
    parameters: [
      { param: "01.01", value: "AI1", note: "Speed reference from BAS 0-10V" },
      { param: "12.01", value: "0-10V", note: "Analog input 1 signal type" },
      { param: "01.05", value: "60 Hz", note: "Maximum frequency" },
      { param: "01.06", value: "12 Hz", note: "Minimum frequency" },
      { param: "01.07", value: "60 s", note: "Acceleration (slow for large fans)" },
      { param: "01.08", value: "90 s", note: "Deceleration (coast down)" },
      { param: "02.01", value: "DI1", note: "Enable from BAS" },
    ],
  },
  {
    title: "Chilled/Hot Water Pump",
    description:
      "Secondary chilled or hot water pump with differential pressure PID.",
    parameters: [
      { param: "40.01", value: "Enabled", note: "PID enable" },
      { param: "40.02", value: "15 psi", note: "DP setpoint (adjust per system)" },
      { param: "40.03", value: "1.5", note: "PID proportional gain" },
      { param: "40.04", value: "15 s", note: "PID integration time" },
      { param: "40.06", value: "AI1", note: "DP transducer feedback" },
      { param: "01.06", value: "25 Hz", note: "Minimum frequency (prevent deadhead)" },
      { param: "01.07", value: "20 s", note: "Acceleration time" },
      { param: "01.08", value: "20 s", note: "Deceleration time" },
    ],
  },
];

export default function ABBDriveTools() {
  const [tab, setTab] = useState<Tab>("faults");
  const { recordUsage } = useSubscription();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      recordUsage("abb-faults");
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
        <PaidFeatureGate toolName="abb-faults">
          <SearchableTable
            data={abbFaults}
            columns={faultColumns}
            categoryKey="category"
            categoryLabel="Categories"
            searchPlaceholder="Search fault codes, names, or descriptions..."
          />
        </PaidFeatureGate>
      )}

      {/* Parameters Tab */}
      {tab === "parameters" && (
        <PaidFeatureGate toolName="abb-parameters">
          <SearchableTable
            data={abbParameters}
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
