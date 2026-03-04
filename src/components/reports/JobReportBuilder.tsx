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
  // Dynamic import to avoid SSR issues
  return import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    function checkPageBreak(needed: number) {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // Header line
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(title || "Field Tech Report", margin, y);
    y += 8;

    // Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), margin, y);
    y += 8;

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const metaItems = [
      { label: "Site", value: siteName },
      { label: "Equipment", value: equipment },
      { label: "Technician", value: technician },
      { label: "Entries", value: String(entries.length) },
    ];
    for (const item of metaItems) {
      if (item.value) {
        doc.setFont("helvetica", "bold");
        doc.text(`${item.label}: `, margin, y);
        const labelWidth = doc.getTextWidth(`${item.label}: `);
        doc.setFont("helvetica", "normal");
        doc.text(item.value, margin + labelWidth, y);
        y += 5;
      }
    }
    y += 4;

    // Separator
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Entries
    if (entries.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("No findings captured.", margin, y);
    } else {
      entries.forEach((entry, idx) => {
        checkPageBreak(28);

        // Entry header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const heading = `${idx + 1}. ${renderTypeLabel(entry.type)} — ${entry.title}`;
        const headingLines = doc.splitTextToSize(heading, contentWidth);
        doc.text(headingLines, margin, y);
        y += headingLines.length * 5;

        // Timestamp
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(formatTimestamp(entry.createdAt), margin + 2, y);
        y += 4;

        // Source
        if (entry.source) {
          doc.setFont("helvetica", "italic");
          doc.text(`Source: ${entry.source}`, margin + 2, y);
          y += 4;
        }

        // Summary
        if (entry.summary) {
          checkPageBreak(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const summaryLines = doc.splitTextToSize(entry.summary, contentWidth - 4);
          doc.text(summaryLines, margin + 2, y);
          y += summaryLines.length * 4;
        }

        // Fields
        if (entry.fields && Object.keys(entry.fields).length > 0) {
          checkPageBreak(6);
          y += 1;
          for (const [key, value] of Object.entries(entry.fields)) {
            checkPageBreak(5);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            const fieldLabel = `${key}: `;
            doc.text(fieldLabel, margin + 4, y);
            const flw = doc.getTextWidth(fieldLabel);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
            const valLines = doc.splitTextToSize(value, contentWidth - 6 - flw);
            doc.text(valLines, margin + 4 + flw, y);
            y += valLines.length * 4;
          }
        }

        y += 5;

        // Entry separator
        if (idx < entries.length - 1) {
          checkPageBreak(4);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(margin + 2, y - 2, pageWidth - margin - 2, y - 2);
          y += 2;
        }
      });
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${title || "Field Tech Report"} — Page ${i} of ${totalPages}`,
        margin,
        pageHeight - 10
      );
      doc.text("Generated by FieldKit Pro", pageWidth - margin - doc.getTextWidth("Generated by FieldKit Pro"), pageHeight - 10);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={meta.reportTitle}
            onChange={(event) => updateMeta({ reportTitle: event.target.value })}
            placeholder="Report title"
            className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
          />
          <input
            value={meta.siteName}
            onChange={(event) => updateMeta({ siteName: event.target.value })}
            placeholder="Site name"
            className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
          />
          <input
            value={meta.equipment}
            onChange={(event) => updateMeta({ equipment: event.target.value })}
            placeholder="Equipment tag / asset"
            className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
          />
          <input
            value={meta.technician}
            onChange={(event) => updateMeta({ technician: event.target.value })}
            placeholder="Technician name"
            className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-semibold">Add Findings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Note</label>
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
              placeholder="Add observed behavior, root cause notes, or work performed."
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
            />
            <button
              onClick={handleAddNote}
              className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white min-h-11"
            >
              Add note
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Parameter Change</label>
            <input
              value={paramName}
              onChange={(event) => setParamName(event.target.value)}
              placeholder="Parameter ID (e.g., 01.07)"
              className="w-full px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={oldValue}
                onChange={(event) => setOldValue(event.target.value)}
                placeholder="Old value"
                className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
              />
              <input
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder="New value"
                className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)]"
              />
            </div>
            <button
              onClick={handleAddParameterChange}
              className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white min-h-11"
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
          <p className="text-sm text-[var(--muted-foreground)]">
            No findings captured yet. Add from tools or use the forms above.
          </p>
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
            className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white min-h-11"
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
