"use client";

import { useState, useMemo } from "react";

// ───── Types ─────

interface UnitDef {
  name: string;
  abbr: string;
  toBase: (v: number) => number; // convert to base unit
  fromBase: (v: number) => number; // convert from base unit
}

interface Category {
  name: string;
  icon: string;
  units: UnitDef[];
}

// ───── Unit Categories ─────

const categories: Category[] = [
  {
    name: "Temperature",
    icon: "🌡️",
    units: [
      { name: "Fahrenheit", abbr: "°F", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { name: "Celsius", abbr: "°C", toBase: (v) => v, fromBase: (v) => v },
      { name: "Kelvin", abbr: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      { name: "Rankine", abbr: "°R", toBase: (v) => (v - 491.67) * (5 / 9), fromBase: (v) => v * (9 / 5) + 491.67 },
    ],
  },
  {
    name: "Pressure",
    icon: "🔵",
    units: [
      { name: "in. w.c.", abbr: "inWC", toBase: (v) => v * 249.089, fromBase: (v) => v / 249.089 },
      { name: "Pascals", abbr: "Pa", toBase: (v) => v, fromBase: (v) => v },
      { name: "Kilopascals", abbr: "kPa", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "PSI", abbr: "psi", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { name: "Bar", abbr: "bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { name: "mm Hg", abbr: "mmHg", toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
      { name: "in. Hg", abbr: "inHg", toBase: (v) => v * 3386.39, fromBase: (v) => v / 3386.39 },
    ],
  },
  {
    name: "Airflow",
    icon: "💨",
    units: [
      { name: "CFM", abbr: "CFM", toBase: (v) => v * 0.471947, fromBase: (v) => v / 0.471947 },
      { name: "Liters/sec", abbr: "L/s", toBase: (v) => v, fromBase: (v) => v },
      { name: "m³/hour", abbr: "m³/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { name: "m³/sec", abbr: "m³/s", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    name: "Water Flow",
    icon: "🚿",
    units: [
      { name: "GPM", abbr: "GPM", toBase: (v) => v * 0.0630902, fromBase: (v) => v / 0.0630902 },
      { name: "Liters/sec", abbr: "L/s", toBase: (v) => v, fromBase: (v) => v },
      { name: "Liters/min", abbr: "L/min", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { name: "m³/hour", abbr: "m³/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    ],
  },
  {
    name: "Air Velocity",
    icon: "🌀",
    units: [
      { name: "Feet/min", abbr: "FPM", toBase: (v) => v * 0.00508, fromBase: (v) => v / 0.00508 },
      { name: "Meters/sec", abbr: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { name: "MPH", abbr: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { name: "km/hour", abbr: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    ],
  },
  {
    name: "Power & Energy",
    icon: "⚡",
    units: [
      { name: "BTU/hour", abbr: "BTU/h", toBase: (v) => v * 0.293071, fromBase: (v) => v / 0.293071 },
      { name: "Kilowatts", abbr: "kW", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Watts", abbr: "W", toBase: (v) => v, fromBase: (v) => v },
      { name: "Tons (cooling)", abbr: "tons", toBase: (v) => v * 3516.85, fromBase: (v) => v / 3516.85 },
      { name: "Horsepower", abbr: "HP", toBase: (v) => v * 745.7, fromBase: (v) => v / 745.7 },
      { name: "MBH", abbr: "MBH", toBase: (v) => v * 293.071, fromBase: (v) => v / 293.071 },
    ],
  },
  {
    name: "Length",
    icon: "📏",
    units: [
      { name: "Inches", abbr: "in", toBase: (v) => v * 25.4, fromBase: (v) => v / 25.4 },
      { name: "Millimeters", abbr: "mm", toBase: (v) => v, fromBase: (v) => v },
      { name: "Feet", abbr: "ft", toBase: (v) => v * 304.8, fromBase: (v) => v / 304.8 },
      { name: "Meters", abbr: "m", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    name: "Volume",
    icon: "🪣",
    units: [
      { name: "Gallons (US)", abbr: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { name: "Liters", abbr: "L", toBase: (v) => v, fromBase: (v) => v },
      { name: "Cubic feet", abbr: "ft³", toBase: (v) => v * 28.3168, fromBase: (v) => v / 28.3168 },
      { name: "Cubic meters", abbr: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
];

// ───── RTD Lookup Data ─────

const rtdTable = [
  { tempF: -40, tempC: -40, pt100: 84.27, pt1000: 842.7 },
  { tempF: -4, tempC: -20, pt100: 92.16, pt1000: 921.6 },
  { tempF: 32, tempC: 0, pt100: 100.0, pt1000: 1000.0 },
  { tempF: 50, tempC: 10, pt100: 103.9, pt1000: 1039.0 },
  { tempF: 68, tempC: 20, pt100: 107.79, pt1000: 1077.9 },
  { tempF: 77, tempC: 25, pt100: 109.73, pt1000: 1097.3 },
  { tempF: 86, tempC: 30, pt100: 111.67, pt1000: 1116.7 },
  { tempF: 100, tempC: 37.8, pt100: 114.71, pt1000: 1147.1 },
  { tempF: 104, tempC: 40, pt100: 115.54, pt1000: 1155.4 },
  { tempF: 122, tempC: 50, pt100: 119.4, pt1000: 1194.0 },
  { tempF: 140, tempC: 60, pt100: 123.24, pt1000: 1232.4 },
  { tempF: 150, tempC: 65.6, pt100: 125.16, pt1000: 1251.6 },
  { tempF: 158, tempC: 70, pt100: 127.07, pt1000: 1270.7 },
  { tempF: 176, tempC: 80, pt100: 130.89, pt1000: 1308.9 },
  { tempF: 200, tempC: 93.3, pt100: 136.0, pt1000: 1360.0 },
  { tempF: 212, tempC: 100, pt100: 138.5, pt1000: 1385.0 },
  { tempF: 250, tempC: 121.1, pt100: 146.56, pt1000: 1465.6 },
  { tempF: 300, tempC: 148.9, pt100: 157.31, pt1000: 1573.1 },
  { tempF: 400, tempC: 204.4, pt100: 178.56, pt1000: 1785.6 },
  { tempF: 500, tempC: 260.0, pt100: 199.09, pt1000: 1990.9 },
];

// ───── Signal Scaling Types ─────

type SignalType = "4-20mA" | "0-10V" | "2-10V" | "0-20mA";

// ───── Unit Converter Section ─────

function ConverterSection() {
  const [catIdx, setCatIdx] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [inputVal, setInputVal] = useState(1);

  const cat = categories[catIdx];

  const results = useMemo(() => {
    const baseVal = cat.units[fromIdx].toBase(inputVal);
    return cat.units.map((unit, i) => ({
      ...unit,
      value: i === fromIdx ? inputVal : unit.fromBase(baseVal),
    }));
  }, [cat, fromIdx, inputVal]);

  return (
    <div className="space-y-5">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c, i) => (
          <button
            key={c.name}
            onClick={() => { setCatIdx(i); setFromIdx(0); setInputVal(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              catIdx === i
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="conv-val" className="block text-sm font-medium mb-1.5">Value</label>
          <input
            id="conv-val"
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label htmlFor="conv-from" className="block text-sm font-medium mb-1.5">From</label>
          <select
            id="conv-from"
            value={fromIdx}
            onChange={(e) => setFromIdx(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {cat.units.map((u, i) => (
              <option key={u.abbr} value={i}>{u.name} ({u.abbr})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          {cat.icon} {cat.name} Conversions
        </h3>
        {results.map((r) => (
          <div
            key={r.abbr}
            className={`flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0 ${
              r.abbr === cat.units[fromIdx].abbr ? "text-[var(--primary)]" : ""
            }`}
          >
            <span className="text-sm text-[var(--muted-foreground)]">{r.name}</span>
            <span className="text-sm font-medium tabular-nums">
              {Math.abs(r.value) < 0.001 && r.value !== 0
                ? r.value.toExponential(3)
                : Math.abs(r.value) > 999999
                ? r.value.toExponential(3)
                : r.value.toFixed(Math.abs(r.value) < 1 ? 4 : Math.abs(r.value) < 100 ? 2 : 1)
              }{" "}
              <span className="text-[var(--muted-foreground)]">{r.abbr}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───── RTD Table Section ─────

function RTDSection() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return rtdTable;
    const s = parseFloat(search);
    if (isNaN(s)) return rtdTable;
    // Show rows near the search value (match against any column)
    return rtdTable.filter(
      (r) =>
        Math.abs(r.tempF - s) < 30 ||
        Math.abs(r.tempC - s) < 20 ||
        Math.abs(r.pt100 - s) < 10 ||
        Math.abs(r.pt1000 - s) < 100
    );
  }, [search]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="rtd-search" className="block text-sm font-medium mb-1.5">
          Search (°F, °C, or ohms)
        </label>
        <input
          id="rtd-search"
          type="number"
          placeholder="e.g., 100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] max-w-xs"
        />
      </div>

      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <th className="text-left px-4 py-3 font-medium">°F</th>
                <th className="text-left px-4 py-3 font-medium">°C</th>
                <th className="text-right px-4 py-3 font-medium">PT100 (Ω)</th>
                <th className="text-right px-4 py-3 font-medium">PT1000 (Ω)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.tempF} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/50">
                  <td className="px-4 py-2.5 tabular-nums">{r.tempF}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.tempC}</td>
                  <td className="px-4 py-2.5 tabular-nums text-right font-medium">{r.pt100.toFixed(2)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-right font-medium">{r.pt1000.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Based on IEC 60751 platinum RTD standard (alpha = 0.00385). PT100 = 100Ω at 0°C, PT1000 = 1000Ω at 0°C.
      </p>
    </div>
  );
}

// ───── Signal Scaling Section ─────

function SignalScaling() {
  const [sigType, setSigType] = useState<SignalType>("4-20mA");
  const [engLow, setEngLow] = useState(0);
  const [engHigh, setEngHigh] = useState(100);
  const [sigVal, setSigVal] = useState(12);

  const sigRanges: Record<SignalType, [number, number, string]> = {
    "4-20mA": [4, 20, "mA"],
    "0-10V": [0, 10, "V"],
    "2-10V": [2, 10, "V"],
    "0-20mA": [0, 20, "mA"],
  };

  const [sigMin, sigMax, sigUnit] = sigRanges[sigType];

  const engValue = useMemo(() => {
    const pct = (sigVal - sigMin) / (sigMax - sigMin);
    return engLow + pct * (engHigh - engLow);
  }, [sigVal, sigMin, sigMax, engLow, engHigh]);

  const pct = useMemo(() => {
    return ((sigVal - sigMin) / (sigMax - sigMin)) * 100;
  }, [sigVal, sigMin, sigMax]);

  // Quick reference points
  const refPoints = [0, 25, 50, 75, 100].map((p) => ({
    pct: p,
    signal: sigMin + (p / 100) * (sigMax - sigMin),
    eng: engLow + (p / 100) * (engHigh - engLow),
  }));

  return (
    <div className="space-y-5">
      {/* Signal type */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(sigRanges) as SignalType[]).map((st) => (
          <button
            key={st}
            onClick={() => {
              setSigType(st);
              const [min, max] = sigRanges[st];
              setSigVal(min + (max - min) / 2);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              sigType === st
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Engineering range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="eng-low" className="block text-xs text-[var(--muted-foreground)] mb-1">
            Eng. Low ({sigMin} {sigUnit})
          </label>
          <input
            id="eng-low"
            type="number"
            value={engLow}
            onChange={(e) => setEngLow(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label htmlFor="eng-high" className="block text-xs text-[var(--muted-foreground)] mb-1">
            Eng. High ({sigMax} {sigUnit})
          </label>
          <input
            id="eng-high"
            type="number"
            value={engHigh}
            onChange={(e) => setEngHigh(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label htmlFor="sig-val" className="block text-xs text-[var(--muted-foreground)] mb-1">
            Signal ({sigUnit})
          </label>
          <input
            id="sig-val"
            type="number"
            step={0.1}
            value={sigVal}
            onChange={(e) => setSigVal(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      {/* Result */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          Signal Scaling Result
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-2xl font-bold text-[var(--primary)]">{sigVal.toFixed(1)}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{sigUnit}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--primary)]">{pct.toFixed(1)}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">%</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--primary)]">{engValue.toFixed(1)}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Eng. Units</div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="progress-bar mb-4">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>

        {/* Quick reference */}
        <h4 className="text-xs text-[var(--muted-foreground)] mb-2 uppercase tracking-wide font-medium">
          Quick Reference
        </h4>
        <div className="space-y-1">
          {refPoints.map((rp) => (
            <div key={rp.pct} className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>{rp.pct}%</span>
              <span className="tabular-nums">{rp.signal.toFixed(1)} {sigUnit}</span>
              <span className="tabular-nums font-medium text-[var(--foreground)]">{rp.eng.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Common scaling examples */}
      <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-2">Common BAS Signal Ranges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(0); setEngHigh(100); setSigType("4-20mA"); setSigVal(12); }}
          >
            <span className="font-medium text-[var(--foreground)]">0-100%</span> — Valve/damper position
          </button>
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(0); setEngHigh(5); setSigType("4-20mA"); setSigVal(12); }}
          >
            <span className="font-medium text-[var(--foreground)]">0-5 inWC</span> — Duct static pressure
          </button>
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(40); setEngHigh(240); setSigType("4-20mA"); setSigVal(12); }}
          >
            <span className="font-medium text-[var(--foreground)]">40-240°F</span> — Temperature transmitter
          </button>
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(0); setEngHigh(60); setSigType("0-10V"); setSigVal(5); }}
          >
            <span className="font-medium text-[var(--foreground)]">0-60 Hz</span> — VFD speed reference
          </button>
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(0); setEngHigh(150); setSigType("4-20mA"); setSigVal(12); }}
          >
            <span className="font-medium text-[var(--foreground)]">0-150 PSI</span> — Pressure transmitter
          </button>
          <button
            className="text-left px-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors"
            onClick={() => { setEngLow(0); setEngHigh(100); setSigType("2-10V"); setSigVal(6); }}
          >
            <span className="font-medium text-[var(--foreground)]">0-100%</span> — 2-10V actuator
          </button>
        </div>
      </div>
    </div>
  );
}

// ───── Main Component ─────

type Tab = "units" | "rtd" | "signals";

export default function UnitConverter() {
  const [tab, setTab] = useState<Tab>("units");

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--card)] border border-[var(--border)] w-fit">
        {([
          { key: "units" as Tab, label: "Unit Converter" },
          { key: "rtd" as Tab, label: "RTD Tables" },
          { key: "signals" as Tab, label: "Signal Scaling" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "units" && <ConverterSection />}
      {tab === "rtd" && <RTDSection />}
      {tab === "signals" && <SignalScaling />}
    </div>
  );
}
