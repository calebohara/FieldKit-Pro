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
  lines.push(title || "Field Service Report");
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPrintableHtml(
  title: string,
  siteName: string,
  equipment: string,
  technician: string,
  entries: JobReportEntry[]
) {
  const rows = entries
    .map((entry, idx) => {
      const details = entry.fields
        ? Object.entries(entry.fields)
            .map(
              ([key, value]) =>
                `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`
            )
            .join("")
        : "";

      return `
        <section style="margin:0 0 16px 0;padding:12px;border:1px solid #d1d5db;border-radius:8px;">
          <h3 style="margin:0 0 8px 0;font-size:15px;">${idx + 1}. ${escapeHtml(renderTypeLabel(entry.type))} - ${escapeHtml(entry.title)}</h3>
          <p style="margin:0 0 4px 0;font-size:12px;"><strong>Time:</strong> ${escapeHtml(formatTimestamp(entry.createdAt))}</p>
          ${entry.source ? `<p style="margin:0 0 4px 0;font-size:12px;"><strong>Source:</strong> ${escapeHtml(entry.source)}</p>` : ""}
          ${entry.summary ? `<p style="margin:0 0 6px 0;font-size:12px;"><strong>Summary:</strong> ${escapeHtml(entry.summary)}</p>` : ""}
          ${details ? `<ul style="margin:0;padding-left:18px;font-size:12px;">${details}</ul>` : ""}
        </section>
      `;
    })
    .join("");

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title || "Field Service Report")}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;color:#0f172a;">
      <h1 style="margin:0 0 8px 0;">${escapeHtml(title || "Field Service Report")}</h1>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Site:</strong> ${escapeHtml(siteName || "-")}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Equipment:</strong> ${escapeHtml(equipment || "-")}</p>
      <p style="margin:0 0 16px 0;font-size:13px;"><strong>Technician:</strong> ${escapeHtml(technician || "-")}</p>
      ${rows || "<p>No findings captured yet.</p>"}
    </body>
  </html>
  `;
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
    return `${meta.reportTitle || "Field Service Report"} | ${entries.length} entries | ${meta.siteName || "No site specified"}`;
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
    const safeTitle = (meta.reportTitle || "field-service-report")
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
    const safeTitle = (meta.reportTitle || "field-service-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    downloadFile(`${safeTitle}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  function handleExportPdfPrint() {
    const html = buildPrintableHtml(
      meta.reportTitle,
      meta.siteName,
      meta.equipment,
      meta.technician,
      entries
    );
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setShareStatus("Popup blocked. Enable popups to export PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 150);
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: meta.reportTitle || "Field Service Report",
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
            onClick={handleExportPdfPrint}
            className="px-3 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white min-h-11"
          >
            Export PDF (Print)
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
