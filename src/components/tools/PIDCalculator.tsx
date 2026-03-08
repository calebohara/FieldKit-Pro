"use client";

import { useState, useMemo } from "react";
import { useJobReport } from "@/lib/job-report";

// ----- Types -----

type ProcessType = "heating" | "cooling" | "pressure" | "flow";
type OvershootTolerance = "none" | "low" | "moderate" | "high";

interface PIDValues {
  p: number;
  i: number;
  d: number;
}

interface Preset {
  name: string;
  processType: ProcessType;
  responseTime: number;
  overshoot: OvershootTolerance;
  description: string;
}

interface TuningTip {
  loop: string;
  tips: string[];
}

// ----- HVAC Presets -----

const presets: Preset[] = [
  {
    name: "AHU Discharge Air",
    processType: "heating",
    responseTime: 120,
    overshoot: "low",
    description: "Typical AHU discharge air temperature control with hot water coil",
  },
  {
    name: "Chilled Water Valve",
    processType: "cooling",
    responseTime: 90,
    overshoot: "moderate",
    description: "Chilled water valve controlling AHU cooling coil",
  },
  {
    name: "Hot Water Valve",
    processType: "heating",
    responseTime: 180,
    overshoot: "low",
    description: "Hot water valve controlling AHU heating coil or reheat",
  },
  {
    name: "Static Pressure",
    processType: "pressure",
    responseTime: 30,
    overshoot: "none",
    description: "Duct static pressure control via VFD on supply fan",
  },
  {
    name: "Building Pressure",
    processType: "pressure",
    responseTime: 60,
    overshoot: "none",
    description: "Building pressurization via relief or return fan",
  },
  {
    name: "VAV Box Airflow",
    processType: "flow",
    responseTime: 15,
    overshoot: "none",
    description: "VAV terminal unit airflow control with pressure-independent controller",
  },
  {
    name: "Cooling Tower Fan",
    processType: "cooling",
    responseTime: 120,
    overshoot: "low",
    description: "Cooling tower fan speed control for condenser water temperature",
  },
  {
    name: "Boiler HW Supply",
    processType: "heating",
    responseTime: 240,
    overshoot: "none",
    description: "Boiler hot water supply temperature control — slow thermal mass",
  },
  {
    name: "Chiller CHW Supply",
    processType: "cooling",
    responseTime: 180,
    overshoot: "none",
    description: "Chiller leaving chilled water temperature control",
  },
  {
    name: "Exhaust Fan Pressure",
    processType: "pressure",
    responseTime: 20,
    overshoot: "none",
    description: "Exhaust fan speed control for kitchen or lab hood pressure",
  },
  {
    name: "Condenser Water",
    processType: "cooling",
    responseTime: 150,
    overshoot: "low",
    description: "Condenser water temperature control via cooling tower staging",
  },
  {
    name: "Humidifier Control",
    processType: "flow",
    responseTime: 90,
    overshoot: "low",
    description: "Steam or electrode humidifier controlling space or duct humidity",
  },
];

// ----- Tuning Tips -----

const tuningTips: TuningTip[] = [
  {
    loop: "Discharge Air Temperature",
    tips: [
      "Start with P-only control and add I slowly",
      "Heating and cooling should have separate PID parameters",
      "Typical deadband: 2-4°F between heating and cooling",
      "Use a 60-120 second sample time for stability",
      "Avoid derivative action — temperature loops rarely need it",
    ],
  },
  {
    loop: "Duct Static Pressure",
    tips: [
      "Very fast response — keep gains low to avoid oscillation",
      "Small proportional band (high gain) causes VFD hunting",
      "Integral time should be 15-30 seconds",
      "Derivative action can help with sudden load changes",
      "Consider trim-and-respond (T&R) as an alternative to PID",
    ],
  },
  {
    loop: "Chilled/Hot Water Valves",
    tips: [
      "Valve actuator stroke time affects tuning significantly",
      "90-second actuators need different tuning than 30-second actuators",
      "Watch for valve hunting — reduce gain or add deadband",
      "Ensure valve is properly sized — oversized valves are uncontrollable",
      "Use a minimum position (e.g., 10%) to prevent freeze conditions",
    ],
  },
  {
    loop: "Building Pressure",
    tips: [
      "Extremely sensitive loop — start with very low gains",
      "Wind effects cause large disturbances — robust integral needed",
      "Relief damper and return fan should not fight each other",
      "Typical setpoint: 0.03 to 0.10 in. w.c. positive",
      "Consider a barometric relief as backup to active control",
    ],
  },
  {
    loop: "VAV Box Flow Control",
    tips: [
      "Fast-acting loop — 5-15 second response typical",
      "P-only control often sufficient for pressure-independent boxes",
      "Integral action needed if offset is unacceptable",
      "Avoid derivative — airflow signal is often noisy",
      "Ensure flow sensor is calibrated and reading correctly",
    ],
  },
  {
    loop: "Cooling Tower / Condenser Water",
    tips: [
      "Long thermal lag — use conservative integral times (120-240s)",
      "Staging fans is more energy efficient than modulating all at once",
      "Enable wet-bulb approach reset for energy savings",
      "Avoid cycling — add hysteresis between fan speed stages",
      "Consider condenser water reset based on chiller efficiency",
    ],
  },
  {
    loop: "Boiler / Hot Water Reset",
    tips: [
      "Boiler thermal mass is huge — very slow response expected",
      "Use outdoor air reset schedule to lower HW supply setpoint",
      "Integral action is critical — P-only will always have offset",
      "Monitor return water temperature to avoid thermal shock",
      "Stage boilers on lead-lag with delay timers between stages",
    ],
  },
  {
    loop: "Humidification",
    tips: [
      "Humidity sensors drift — calibrate seasonally",
      "Steam humidifiers respond faster than electrode types",
      "Place duct humidity sensor 10+ feet downstream of injection",
      "Deadband between humidification and dehumidification: 5-10% RH",
      "In cold climates, limit humidity based on window condensation",
    ],
  },
];

// ----- PID Calculation Logic -----

// Base PID values by process type (empirical HVAC-tuned values)
const baseValues: Record<ProcessType, PIDValues> = {
  heating: { p: 8, i: 120, d: 0 },
  cooling: { p: 6, i: 90, d: 0 },
  pressure: { p: 3, i: 20, d: 5 },
  flow: { p: 4, i: 30, d: 2 },
};

// Overshoot multipliers: [P multiplier, I multiplier, D multiplier]
const overshootFactors: Record<OvershootTolerance, [number, number, number]> = {
  none: [0.6, 1.5, 1.5],     // Conservative — slow, no overshoot
  low: [0.8, 1.2, 1.2],      // Slightly conservative
  moderate: [1.0, 1.0, 1.0], // Balanced
  high: [1.4, 0.7, 0.5],     // Aggressive — fast, allows overshoot
};

function calculatePID(
  processType: ProcessType,
  responseTime: number,
  overshoot: OvershootTolerance
): PIDValues {
  const base = baseValues[processType];
  const [pFactor, iFactor, dFactor] = overshootFactors[overshoot];

  // Clamp response time to valid range
  const rt = Math.max(5, Math.min(600, responseTime || 60));

  // Scale by response time — longer response = less aggressive
  const timeScale = 60 / rt;

  return {
    p: Math.round(base.p * pFactor * (1 + timeScale * 0.3) * 10) / 10,
    i: Math.round(base.i * iFactor * (rt / 60) * 10) / 10,
    d: Math.round(base.d * dFactor * (rt / 60) * 10) / 10,
  };
}

/** Convert gain (Kp) to proportional band percentage: PB% = 100 / Kp */
function gainToPB(kp: number): number {
  if (kp <= 0) return 999;
  return Math.round((100 / kp) * 10) / 10;
}

/** Get stability assessment based on PID values and process type */
function getStabilityNote(
  pid: PIDValues,
  processType: ProcessType,
  overshoot: OvershootTolerance
): { level: "stable" | "caution" | "aggressive"; message: string } {
  // High gain on slow processes is risky
  if (pid.p > 12 && (processType === "heating" || processType === "cooling")) {
    return { level: "aggressive", message: "High gain on a thermal loop — watch for oscillation. Reduce P if output hunts." };
  }
  // Very short integral on slow processes
  if (pid.i < 30 && (processType === "heating" || processType === "cooling")) {
    return { level: "aggressive", message: "Short integral time on a slow process — may cause windup or overshoot. Increase I time." };
  }
  // Pressure with high gain
  if (pid.p > 6 && processType === "pressure") {
    return { level: "caution", message: "Pressure loops are fast-acting — high gain can cause rapid oscillation. Start lower and increase." };
  }
  if (overshoot === "high") {
    return { level: "caution", message: "Aggressive tuning selected — monitor closely during commissioning. Be ready to reduce P." };
  }
  return { level: "stable", message: "Parameters are within typical ranges for this loop type." };
}

// ----- Response Curve SVG -----

function ResponseCurve({
  pid,
  overshoot,
}: {
  pid: PIDValues;
  overshoot: OvershootTolerance;
}) {
  const width = 400;
  const height = 200;
  const padding = 30;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  // Generate a simulated step response curve
  const points = useMemo(() => {
    const n = 100;
    const pts: string[] = [];

    // Overshoot amount
    const overshootMap: Record<OvershootTolerance, number> = {
      none: 0,
      low: 0.05,
      moderate: 0.15,
      high: 0.3,
    };
    const os = overshootMap[overshoot];

    // Damping factor based on PID
    const damping = pid.d > 0 ? 0.3 : 0.15;
    const speed = Math.min(pid.p / 5, 2);

    for (let i = 0; i <= n; i++) {
      const t = i / n; // normalized time 0-1
      const tau = t * 5 * speed;

      // Second-order step response approximation
      let y: number;
      if (tau < 0.1) {
        y = 0;
      } else {
        const rise = 1 - Math.exp(-tau * (1 + damping));
        const oscillation = os * Math.exp(-tau * 1.5) * Math.sin(tau * 4);
        y = Math.min(rise + oscillation, 1 + os);
      }

      const x = padding + (i / n) * plotW;
      const yPos = padding + plotH - y * plotH * 0.85;
      pts.push(`${x},${yPos}`);
    }

    return pts.join(" ");
  }, [pid, overshoot]);

  // Setpoint line y position
  const setpointY = padding + plotH * 0.15;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-md"
      role="img"
      aria-label="Expected PID response curve"
    >
      {/* Background */}
      <rect width={width} height={height} fill="transparent" />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={padding}
          y1={padding + plotH * frac}
          x2={padding + plotW}
          y2={padding + plotH * frac}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}

      {/* Setpoint line */}
      <line
        x1={padding}
        y1={setpointY}
        x2={padding + plotW}
        y2={setpointY}
        stroke="var(--primary)"
        strokeWidth={1}
        strokeDasharray="6,3"
        opacity={0.6}
      />
      <text
        x={padding + plotW + 4}
        y={setpointY + 4}
        fontSize={10}
        fill="var(--primary)"
        opacity={0.8}
      >
        SP
      </text>

      {/* Response curve */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={padding + plotH}
        stroke="var(--muted-foreground)"
        strokeWidth={1}
      />
      <line
        x1={padding}
        y1={padding + plotH}
        x2={padding + plotW}
        y2={padding + plotH}
        stroke="var(--muted-foreground)"
        strokeWidth={1}
      />

      {/* Labels */}
      <text
        x={padding + plotW / 2}
        y={height - 4}
        textAnchor="middle"
        fontSize={11}
        fill="var(--muted-foreground)"
      >
        Time
      </text>
      <text
        x={8}
        y={padding + plotH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="var(--muted-foreground)"
        transform={`rotate(-90, 8, ${padding + plotH / 2})`}
      >
        Output
      </text>
    </svg>
  );
}

// ----- Explanation -----

function getExplanation(
  processType: ProcessType,
  overshoot: OvershootTolerance,
  pid: PIDValues
): string {
  const processNames: Record<ProcessType, string> = {
    heating: "heating",
    cooling: "cooling",
    pressure: "pressure",
    flow: "flow",
  };

  const aggressiveness: Record<OvershootTolerance, string> = {
    none: "conservative (no overshoot allowed)",
    low: "slightly conservative (minimal overshoot)",
    moderate: "balanced (some overshoot acceptable)",
    high: "aggressive (fast response, overshoot expected)",
  };

  let explanation = `For a ${processNames[processType]} loop with ${aggressiveness[overshoot]} tuning: `;
  explanation += `P=${pid.p} provides the proportional response to error. `;
  explanation += `I=${pid.i}s integral time eliminates steady-state offset. `;

  if (pid.d > 0) {
    explanation += `D=${pid.d}s derivative time adds anticipatory action for faster disturbance rejection.`;
  } else {
    explanation += `Derivative action is set to 0 — not recommended for this loop type due to noise sensitivity.`;
  }

  return explanation;
}

// ----- Main Component -----

export default function PIDCalculator() {
  const [processType, setProcessType] = useState<ProcessType>("heating");
  const [responseTime, setResponseTime] = useState(120);
  const [overshoot, setOvershoot] = useState<OvershootTolerance>("low");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const { addEntry } = useJobReport();

  const pid = useMemo(
    () => calculatePID(processType, responseTime, overshoot),
    [processType, responseTime, overshoot]
  );

  const explanation = useMemo(
    () => getExplanation(processType, overshoot, pid),
    [processType, overshoot, pid]
  );

  const stabilityNote = useMemo(
    () => getStabilityNote(pid, processType, overshoot),
    [pid, processType, overshoot]
  );

  const pb = useMemo(() => gainToPB(pid.p), [pid.p]);

  function applyPreset(preset: Preset) {
    setProcessType(preset.processType);
    setResponseTime(preset.responseTime);
    setOvershoot(preset.overshoot);
    setActivePreset(preset.name);
  }

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          HVAC Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              title={preset.description}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-11 ${
                activePreset === preset.name
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="processType" className="block text-sm font-medium mb-1.5">
            Process Type
          </label>
          <select
            id="processType"
            value={processType}
            onChange={(e) => {
              setProcessType(e.target.value as ProcessType);
              setActivePreset(null);
            }}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="heating">Heating</option>
            <option value="cooling">Cooling</option>
            <option value="pressure">Pressure</option>
            <option value="flow">Flow</option>
          </select>
        </div>

        <div>
          <label htmlFor="responseTime" className="block text-sm font-medium mb-1.5">
            Desired Response Time (sec)
          </label>
          <input
            id="responseTime"
            type="number"
            min={5}
            max={600}
            value={responseTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                setResponseTime(Math.max(5, Math.min(600, val)));
              }
              setActivePreset(null);
            }}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label htmlFor="overshoot" className="block text-sm font-medium mb-1.5">
            Overshoot Tolerance
          </label>
          <select
            id="overshoot"
            value={overshoot}
            onChange={(e) => {
              setOvershoot(e.target.value as OvershootTolerance);
              setActivePreset(null);
            }}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PID Values */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-4 uppercase tracking-wide">
            Recommended Starting Values
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">{pid.p}</div>
              <div className="text-sm text-[var(--muted-foreground)] mt-1">
                Kp (Gain)
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                PB = {pb}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">{pid.i}</div>
              <div className="text-sm text-[var(--muted-foreground)] mt-1">
                Ti (sec)
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Integral time
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">{pid.d}</div>
              <div className="text-sm text-[var(--muted-foreground)] mt-1">
                Td (sec)
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Derivative time
              </div>
            </div>
          </div>

          {/* Stability indicator */}
          <div className={`text-xs px-3 py-2 rounded-md mb-3 ${
            stabilityNote.level === "aggressive"
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              : stabilityNote.level === "caution"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
          }`}>
            {stabilityNote.message}
          </div>

          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">
            {explanation}
          </p>

          {/* Platform note */}
          <details className="text-xs text-[var(--muted-foreground)]">
            <summary className="cursor-pointer hover:text-[var(--foreground)] font-medium">
              How to apply these values
            </summary>
            <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-[var(--border)]">
              <p><span className="font-medium text-[var(--foreground)]">Siemens APOGEE/Desigo:</span> Use PB={pb}%, Ti={pid.i}s, Td={pid.d}s</p>
              <p><span className="font-medium text-[var(--foreground)]">Tridium Niagara:</span> Use Kp={pid.p}, Ki={pid.i > 0 ? (Math.round(1/pid.i * 1000) / 1000) : 0}/s (1/Ti), Kd={pid.d}</p>
              <p><span className="font-medium text-[var(--foreground)]">JCI Metasys:</span> Use Throttling Range={pb}%, Reset={pid.i}s</p>
              <p className="italic mt-1">These are starting values. Always validate on the live system and adjust based on observed response.</p>
            </div>
          </details>

          <button
            onClick={() =>
              addEntry({
                type: "pid",
                title: `PID: ${activePreset || processType} loop`,
                summary: `Kp=${pid.p} (PB=${pb}%), Ti=${pid.i}s, Td=${pid.d}s`,
                source: "PID Loop Tuning",
                fields: {
                  Process: processType,
                  "Response Time (s)": String(responseTime),
                  "Overshoot Tolerance": overshoot,
                  "Kp (Gain)": String(pid.p),
                  "PB (%)": String(pb),
                  "Ti (sec)": String(pid.i),
                  "Td (sec)": String(pid.d),
                  Preset: activePreset ?? "Custom",
                },
              })
            }
            className="mt-4 px-3 py-2 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--accent)] min-h-11"
          >
            Add to report
          </button>
        </div>

        {/* Response Curve */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-4 uppercase tracking-wide">
            Predicted Step Response
          </h2>
          <ResponseCurve pid={pid} overshoot={overshoot} />
        </div>
      </div>

      {/* Tuning Tips */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Tuning Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tuningTips.map((section) => (
            <div
              key={section.loop}
              className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
            >
              <h3 className="font-medium mb-2">{section.loop}</h3>
              <ul className="space-y-1.5">
                {section.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-[var(--muted-foreground)] flex gap-2"
                  >
                    <span className="text-[var(--primary)] shrink-0">-</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
