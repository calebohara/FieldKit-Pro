"use client";

import { useState, useMemo } from "react";

// ───── Psychrometric Formulas (ASHRAE-based, imperial units) ─────

/** Saturation vapor pressure in psi from temperature in °F (Magnus-Tetens) */
function saturationPressure(tF: number): number {
  const tC = (tF - 32) * (5 / 9);
  // Result in kPa, convert to psi
  const pKpa = 0.61078 * Math.exp((17.27 * tC) / (tC + 237.3));
  return pKpa * 0.145038;
}

/** Humidity ratio (lb water / lb dry air) from dry bulb °F and RH % */
function humidityRatio(tdb: number, rh: number, patm = 14.696): number {
  const pws = saturationPressure(tdb);
  const pw = (rh / 100) * pws;
  return 0.62198 * (pw / (patm - pw));
}

/** Dewpoint °F from dry bulb °F and RH % */
function dewpoint(tdb: number, rh: number): number {
  const pws = saturationPressure(tdb);
  const pw = (rh / 100) * pws;
  // Convert pw back to kPa for Magnus inverse
  const pwKpa = pw / 0.145038;
  if (pwKpa <= 0) return -40;
  const alpha = Math.log(pwKpa / 0.61078);
  const tdC = (237.3 * alpha) / (17.27 - alpha);
  return tdC * (9 / 5) + 32;
}

/** Wet bulb approximation °F (Stull 2011 regression) */
function wetBulb(tdb: number, rh: number): number {
  const tC = (tdb - 32) * (5 / 9);
  const wbC =
    tC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return wbC * (9 / 5) + 32;
}

/** Enthalpy in BTU/lb dry air */
function enthalpy(tdb: number, w: number): number {
  return 0.24 * tdb + w * (1061 + 0.444 * tdb);
}

/** Specific volume ft³/lb dry air */
function specificVolume(tdb: number, w: number, patm = 14.696): number {
  const tR = tdb + 459.67; // Rankine
  return (0.3704 * tR * (1 + 1.6078 * w)) / patm;
}

/** Grains of moisture per lb dry air (1 lb = 7000 grains) */
function grains(w: number): number {
  return w * 7000;
}

// ───── Types ─────

type Tab = "properties" | "mixedair";

interface AirState {
  tdb: number;
  rh: number;
  dp: number;
  wb: number;
  w: number;
  h: number;
  v: number;
  gr: number;
}

function calcAirState(tdb: number, rh: number): AirState {
  const rhClamped = Math.max(0, Math.min(100, rh));
  const w = humidityRatio(tdb, rhClamped);
  return {
    tdb,
    rh: rhClamped,
    dp: dewpoint(tdb, rhClamped),
    wb: wetBulb(tdb, rhClamped),
    w,
    h: enthalpy(tdb, w),
    v: specificVolume(tdb, w),
    gr: grains(w),
  };
}

// ───── Result Row ─────

function ResultRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {value} <span className="text-[var(--muted-foreground)]">{unit}</span>
      </span>
    </div>
  );
}

// ───── Air Properties Calculator ─────

function AirProperties() {
  const [tdb, setTdb] = useState(75);
  const [rh, setRh] = useState(50);

  const air = useMemo(() => calcAirState(tdb, rh), [tdb, rh]);

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tdb" className="block text-sm font-medium mb-1.5">
            Dry Bulb Temperature
          </label>
          <div className="relative">
            <input
              id="tdb"
              type="number"
              value={tdb}
              onChange={(e) => setTdb(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
              °F
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="rh" className="block text-sm font-medium mb-1.5">
            Relative Humidity
          </label>
          <div className="relative">
            <input
              id="rh"
              type="number"
              min={0}
              max={100}
              value={rh}
              onChange={(e) => setRh(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <p className="text-xs text-[var(--muted-foreground)] mb-2 uppercase tracking-wide font-medium">
          Common Conditions
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Summer Design", tdb: 95, rh: 40 },
            { label: "Winter Design", tdb: 35, rh: 30 },
            { label: "Comfort Zone", tdb: 72, rh: 45 },
            { label: "AHU Discharge", tdb: 55, rh: 90 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setTdb(p.tdb); setRh(p.rh); }}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          Air Properties
        </h3>
        <ResultRow label="Dewpoint" value={air.dp.toFixed(1)} unit="°F" />
        <ResultRow label="Wet Bulb" value={air.wb.toFixed(1)} unit="°F" />
        <ResultRow label="Enthalpy" value={air.h.toFixed(1)} unit="BTU/lb" />
        <ResultRow label="Humidity Ratio" value={air.w.toFixed(4)} unit="lb/lb" />
        <ResultRow label="Moisture Content" value={air.gr.toFixed(1)} unit="gr/lb" />
        <ResultRow label="Specific Volume" value={air.v.toFixed(2)} unit="ft³/lb" />
      </div>

      {/* Diagnostic hints */}
      <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-2">Quick Diagnostic Checks</h3>
        <ul className="space-y-1.5 text-sm text-[var(--muted-foreground)]">
          {air.dp > 60 && (
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">⚠️</span>
              Dewpoint above 60°F — condensation risk on cold surfaces and coils
            </li>
          )}
          {air.rh > 60 && (
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">⚠️</span>
              RH above 60% — mold/mildew risk in occupied spaces
            </li>
          )}
          {air.rh < 30 && (
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">💧</span>
              RH below 30% — consider humidification for comfort and static control
            </li>
          )}
          {air.h > 30 && (
            <li className="flex gap-2">
              <span className="text-orange-400 shrink-0">🔥</span>
              High enthalpy ({air.h.toFixed(1)} BTU/lb) — economizer should be disabled
            </li>
          )}
          {air.h < 22 && tdb < 65 && (
            <li className="flex gap-2">
              <span className="text-green-400 shrink-0">✅</span>
              Low enthalpy — good conditions for free cooling / economizer
            </li>
          )}
          {air.dp <= 60 && air.rh >= 30 && air.rh <= 60 && (
            <li className="flex gap-2">
              <span className="text-green-400 shrink-0">✅</span>
              Conditions are within normal comfort and safety range
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ───── Mixed Air Calculator ─────

function MixedAir() {
  const [oaTdb, setOaTdb] = useState(95);
  const [oaRh, setOaRh] = useState(40);
  const [raTdb, setRaTdb] = useState(75);
  const [raRh, setRaRh] = useState(50);
  const [oaPct, setOaPct] = useState(20);

  const oa = useMemo(() => calcAirState(oaTdb, oaRh), [oaTdb, oaRh]);
  const ra = useMemo(() => calcAirState(raTdb, raRh), [raTdb, raRh]);
  const oaFrac = oaPct / 100;

  const mixed = useMemo(() => {
    const mTdb = oaFrac * oa.tdb + (1 - oaFrac) * ra.tdb;
    const mW = oaFrac * oa.w + (1 - oaFrac) * ra.w;
    const mH = enthalpy(mTdb, mW);
    const mGr = grains(mW);
    // Approximate mixed RH from humidity ratio
    const pws = saturationPressure(mTdb);
    const pw = (mW * 14.696) / (0.62198 + mW);
    const mRh = Math.min((pw / pws) * 100, 100);
    const mDp = dewpoint(mTdb, mRh);
    return { tdb: mTdb, rh: mRh, dp: mDp, w: mW, h: mH, gr: mGr };
  }, [oa, ra, oaFrac]);

  return (
    <div className="space-y-6">
      {/* OA inputs */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          Outside Air (OA)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="oa-tdb" className="block text-xs text-[var(--muted-foreground)] mb-1">
              Dry Bulb (°F)
            </label>
            <input
              id="oa-tdb"
              type="number"
              value={oaTdb}
              onChange={(e) => setOaTdb(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label htmlFor="oa-rh" className="block text-xs text-[var(--muted-foreground)] mb-1">
              RH (%)
            </label>
            <input
              id="oa-rh"
              type="number"
              min={0}
              max={100}
              value={oaRh}
              onChange={(e) => setOaRh(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          h = {oa.h.toFixed(1)} BTU/lb · DP = {oa.dp.toFixed(1)}°F · W = {oa.gr.toFixed(0)} gr/lb
        </p>
      </div>

      {/* RA inputs */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          Return Air (RA)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ra-tdb" className="block text-xs text-[var(--muted-foreground)] mb-1">
              Dry Bulb (°F)
            </label>
            <input
              id="ra-tdb"
              type="number"
              value={raTdb}
              onChange={(e) => setRaTdb(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label htmlFor="ra-rh" className="block text-xs text-[var(--muted-foreground)] mb-1">
              RH (%)
            </label>
            <input
              id="ra-rh"
              type="number"
              min={0}
              max={100}
              value={raRh}
              onChange={(e) => setRaRh(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          h = {ra.h.toFixed(1)} BTU/lb · DP = {ra.dp.toFixed(1)}°F · W = {ra.gr.toFixed(0)} gr/lb
        </p>
      </div>

      {/* OA % slider */}
      <div>
        <label htmlFor="oa-pct" className="block text-sm font-medium mb-2">
          Outside Air Fraction: <span className="text-[var(--primary)]">{oaPct}%</span>
        </label>
        <input
          id="oa-pct"
          type="range"
          min={0}
          max={100}
          value={oaPct}
          onChange={(e) => setOaPct(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
          <span>0% OA (all return)</span>
          <span>100% OA (full economizer)</span>
        </div>
      </div>

      {/* Mixed air results */}
      <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
          Mixed Air Conditions
        </h3>
        <ResultRow label="Mixed Air Temp" value={mixed.tdb.toFixed(1)} unit="°F" />
        <ResultRow label="Mixed Air RH" value={mixed.rh.toFixed(1)} unit="%" />
        <ResultRow label="Mixed Air Dewpoint" value={mixed.dp.toFixed(1)} unit="°F" />
        <ResultRow label="Mixed Air Enthalpy" value={mixed.h.toFixed(1)} unit="BTU/lb" />
        <ResultRow label="Moisture Content" value={mixed.gr.toFixed(0)} unit="gr/lb" />
      </div>

      {/* Economizer hint */}
      <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-2">Economizer Check</h3>
        <ul className="space-y-1.5 text-sm text-[var(--muted-foreground)]">
          {oa.h < ra.h ? (
            <li className="flex gap-2">
              <span className="text-green-400 shrink-0">✅</span>
              OA enthalpy ({oa.h.toFixed(1)}) &lt; RA enthalpy ({ra.h.toFixed(1)}) — economizer should be enabled
            </li>
          ) : (
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">⚠️</span>
              OA enthalpy ({oa.h.toFixed(1)}) &gt; RA enthalpy ({ra.h.toFixed(1)}) — economizer should be disabled
            </li>
          )}
          {oaTdb < 55 && (
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">❄️</span>
              OA below 55°F — watch for coil freeze conditions, ensure minimum OA damper position
            </li>
          )}
          {mixed.dp > 55 && (
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">💧</span>
              Mixed air dewpoint above 55°F — condensation likely on cooling coil
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ───── Main Component ─────

export default function Psychrometrics() {
  const [tab, setTab] = useState<Tab>("properties");

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--card)] border border-[var(--border)] w-fit">
        {([
          { key: "properties" as Tab, label: "Air Properties" },
          { key: "mixedair" as Tab, label: "Mixed Air" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "properties" ? <AirProperties /> : <MixedAir />}
    </div>
  );
}
