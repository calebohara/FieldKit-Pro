"use client";

import { useMemo, useState } from "react";
import {
  useJobReport,
  type JobReportEntry,
  type JobReportEntryType,
} from "@/lib/job-report";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function renderTypeLabel(type: JobReportEntryType) {
  if (type === "fault") return "Fault";
  if (type === "parameter-change") return "Parameter Change";
  if (type === "pid") return "PID Snapshot";
  return "Note";
}

function downloadFile(filename: string, body: string, mime = "text/plain") {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildTextReport(
  title: string,
  siteName: string,
  equipment: string,
  technician: string,
  entries: JobReportEntry[]
) {
  const lines: string[] = [];
  lines.push(title || "Field Tech Report");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Site: ${siteName || "-"}`);
  lines.push(`Equipment: ${equipment || "-"}`);
  lines.push(`Technician: ${technician || "-"}`);
  lines.push(`Entries: ${entries.length}`);
  lines.push("");

  entries.forEach((entry, idx) => {
    lines.push(`${idx + 1}. ${renderTypeLabel(entry.type)} - ${entry.title}`);
    lines.push(`   Time: ${formatTimestamp(entry.createdAt)}`);
    if (entry.source) lines.push(`   Source: ${entry.source}`);
    if (entry.summary) lines.push(`   Summary: ${entry.summary}`);
    if (entry.fields && Object.keys(entry.fields).length > 0) {
      lines.push("   Details:");
      Object.entries(entry.fields).forEach(([key, value]) => {
        lines.push(`   - ${key}: ${value}`);
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

function buildPdf(
  title: string,
  siteName: string,
  equipment: string,
  technician: string,
  entries: JobReportEntry[]
) {
  return import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 20;
    const cw = pw - m * 2;
    let y = m;

    const dark = [30, 41, 59] as const;     // slate-800
    const mid = [100, 116, 139] as const;    // slate-500
    const light = [148, 163, 184] as const;  // slate-400
    const bg = [248, 250, 252] as const;     // slate-50

    function pageBreak(needed: number) {
      if (y + needed > ph - 20) { doc.addPage(); y = m; }
    }

    // ── Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...dark);
    doc.text(title || "Field Tech Report", m, y);
    y += 7;

    // ── Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    doc.text(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      m,
      y
    );
    y += 10;

    // ── Metadata box
    const metaPairs = [
      ["Site", siteName],
      ["Equipment", equipment],
      ["Technician", technician],
    ].filter(([, v]) => v) as [string, string][];

    if (metaPairs.length > 0) {
      const boxH = Math.ceil(metaPairs.length / 2) * 6 + 6;
      doc.setFillColor(...bg);
      doc.roundedRect(m, y - 3, cw, boxH, 2, 2, "F");

      const colW = cw / 2;
      metaPairs.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const tx = m + 4 + col * colW;
        const ty = y + 1 + row * 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...mid);
        doc.text(label.toUpperCase(), tx, ty);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...dark);
        doc.text(value, tx, ty + 3.5);
      });

      y += boxH + 6;
    }

    // ── Entries
    if (entries.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...light);
      doc.text("No findings captured.", m, y);
    } else {
      // Section label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...mid);
      doc.text(`FINDINGS  (${entries.length})`, m, y);
      y += 6;

      entries.forEach((entry, idx) => {
        pageBreak(22);

        // Entry number + type tag
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        const num = `${idx + 1}.`;
        doc.text(num, m, y);
        const numW = doc.getTextWidth(num) + 2;

        // Type as uppercase tag
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...mid);
        const tag = renderTypeLabel(entry.type).toUpperCase();
        doc.text(tag, m + numW, y - 0.3);
        const tagW = doc.getTextWidth(tag) + 3;

        // Title inline after tag
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        const titleX = m + numW + tagW;
        const titleLines = doc.splitTextToSize(entry.title, cw - numW - tagW);
        doc.text(titleLines, titleX, y);
        y += titleLines.length * 4.5 + 1.5;

        // Timestamp + source on one line
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...light);
        let subline = formatTimestamp(entry.createdAt);
        if (entry.source) subline += `  ·  ${entry.source}`;
        doc.text(subline, m + 6, y);
        y += 4.5;

        // Summary
        if (entry.summary) {
          pageBreak(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...dark);
          const lines = doc.splitTextToSize(entry.summary, cw - 6);
          doc.text(lines, m + 6, y);
          y += lines.length * 4 + 1;
        }

        // Fields as key: value pairs
        if (entry.fields && Object.keys(entry.fields).length > 0) {
          pageBreak(6);
          for (const [key, value] of Object.entries(entry.fields)) {
            pageBreak(5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...mid);
            const lbl = `${key}: `;
            doc.text(lbl, m + 6, y);
            const lw = doc.getTextWidth(lbl);
            doc.setTextColor(...dark);
            const vLines = doc.splitTextToSize(value, cw - 8 - lw);
            doc.text(vLines, m + 6 + lw, y);
            y += vLines.length * 3.5 + 0.5;
          }
        }

        y += 4;

        // Hairline separator between entries
        if (idx < entries.length - 1) {
          pageBreak(3);
          doc.setDrawColor(230, 232, 236);
          doc.setLineWidth(0.15);
          doc.line(m, y - 1.5, pw - m, y - 1.5);
          y += 3;
        }
      });
    }

    // ── Footer on each page
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...light);
      const pg = `${i} / ${total}`;
      doc.text(pg, pw - m - doc.getTextWidth(pg), ph - 12);
    }

    return doc;
  });
}

export default function JobReportBuilder() {
  const { meta, entries, updateMeta, addEntry, removeEntry, clearEntries } =
    useJobReport();

  const [noteText, setNoteText] = useState("");
  const [paramName, setParamName] = useState("");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const reportText = useMemo(
    () =>
      buildTextReport(
        meta.reportTitle,
        meta.siteName,
        meta.equipment,
        meta.technician,
        entries
      ),
    [meta, entries]
  );

  const reportSummary = useMemo(() => {
    return `${meta.reportTitle || "Field Tech Report"} | ${entries.length} entries | ${meta.siteName || "No site specified"}`;
  }, [meta.reportTitle, meta.siteName, entries.length]);

  function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    addEntry({
      type: "note",
      title: trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed,
      summary: trimmed,
      source: "Manual note",
    });
    setNoteText("");
  }

  function handleAddParameterChange() {
    const param = paramName.trim();
    if (!param || !oldValue.trim() || !newValue.trim()) return;

    addEntry({
      type: "parameter-change",
      title: `Parameter ${param} adjusted`,
      summary: `Changed from ${oldValue} to ${newValue}`,
      source: "Manual parameter log",
      fields: {
        Parameter: param,
        "Old Value": oldValue.trim(),
        "New Value": newValue.trim(),
      },
    });

    setParamName("");
    setOldValue("");
    setNewValue("");
  }

  function handleExportText() {
    const safeTitle = (meta.reportTitle || "field-tech-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    downloadFile(`${safeTitle}.txt`, reportText, "text/plain");
  }

  function handleExportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      meta,
      entries,
    };
    const safeTitle = (meta.reportTitle || "field-tech-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    downloadFile(`${safeTitle}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  async function handleExportPdf() {
    try {
      const doc = await buildPdf(
        meta.reportTitle,
        meta.siteName,
        meta.equipment,
        meta.technician,
        entries
      );
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`Field-Tech-Report-${dateStr}.pdf`);
    } catch {
      setShareStatus("Failed to generate PDF. Please try again.");
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: meta.reportTitle || "Field Tech Report",
          text: `${reportSummary}\n\n${reportText}`,
        });
        setShareStatus("Shared successfully.");
        return;
      }

      await navigator.clipboard.writeText(reportText);
      setShareStatus("Share not available on this browser. Report copied to clipboard.");
    } catch {
      setShareStatus("Could not share report on this device/browser.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-lg font-semibold">Report Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="report-title" className="block text-sm font-medium mb-1.5">Report title</label>
            <input
              id="report-title"
              value={meta.reportTitle}
              onChange={(event) => updateMeta({ reportTitle: event.target.value })}
              placeholder="e.g., AHU-3 Startup Report"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label htmlFor="site-name" className="block text-sm font-medium mb-1.5">Site name</label>
            <input
              id="site-name"
              value={meta.siteName}
              onChange={(event) => updateMeta({ siteName: event.target.value })}
              placeholder="e.g., Building 400"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label htmlFor="equipment" className="block text-sm font-medium mb-1.5">Equipment tag / asset</label>
            <input
              id="equipment"
              value={meta.equipment}
              onChange={(event) => updateMeta({ equipment: event.target.value })}
              placeholder="e.g., AHU-3, VFD-12"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label htmlFor="technician" className="block text-sm font-medium mb-1.5">Technician name</label>
            <input
              id="technician"
              value={meta.technician}
              onChange={(event) => updateMeta({ technician: event.target.value })}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-semibold">Add Findings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="quick-note" className="text-sm font-medium">Quick Note</label>
            <textarea
              id="quick-note"
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
              placeholder="Add observed behavior, root cause notes, or work performed."
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              onClick={handleAddNote}
              className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] min-h-11"
            >
              Add note
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="param-id" className="text-sm font-medium">Parameter Change</label>
            <input
              id="param-id"
              value={paramName}
              onChange={(event) => setParamName(event.target.value)}
              placeholder="Parameter ID (e.g., 01.07)"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={oldValue}
                onChange={(event) => setOldValue(event.target.value)}
                placeholder="Old value"
                aria-label="Old value"
                className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <input
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder="New value"
                aria-label="New value"
                className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              onClick={handleAddParameterChange}
              className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] min-h-11"
            >
              Add parameter change
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h2 className="text-lg font-semibold">Captured Entries ({entries.length})</h2>
          <button
            onClick={clearEntries}
            className="px-3 py-2 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--accent)]"
          >
            Clear all
          </button>
        </div>

        {entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">No findings captured yet</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Add from tools or use the forms above.</p>
          </div>
        )}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-lg border border-[var(--border)] p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  {renderTypeLabel(entry.type)}
                </p>
                <h3 className="font-medium">{entry.title}</h3>
              </div>
              <button
                onClick={() => removeEntry(entry.id)}
                className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--accent)]"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatTimestamp(entry.createdAt)}
              {entry.source ? ` • ${entry.source}` : ""}
            </p>
            {entry.summary && (
              <p className="text-sm text-[var(--muted-foreground)]">{entry.summary}</p>
            )}
            {entry.fields && Object.keys(entry.fields).length > 0 && (
              <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(entry.fields).map(([key, value]) => (
                  <p key={key} className="text-[var(--muted-foreground)]">
                    <span className="font-medium text-[var(--foreground)]">{key}:</span>{" "}
                    {value}
                  </p>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-semibold">Export / Share</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] min-h-11"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportText}
            className="px-3 py-2 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--accent)]"
          >
            Export TXT
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--accent)]"
          >
            Export JSON
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--accent)]"
          >
            Share / Copy
          </button>
        </div>
        {shareStatus && (
          <p className="text-sm text-[var(--muted-foreground)]">{shareStatus}</p>
        )}
      </section>
    </div>
  );
}
