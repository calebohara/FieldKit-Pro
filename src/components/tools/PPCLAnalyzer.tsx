"use client";

import { useState, useMemo } from "react";
import {
  lintPPCL,
  RULE_DESCRIPTIONS,
  ALL_HIGHLIGHT_KEYWORDS,
  PPCL_RELATIONAL_OPS,
  PPCL_LOGICAL_OPS,
  type Severity,
  type LintResult,
} from "@/lib/ppcl/linter";

// ─── Syntax Highlighting ─────────────────────────────────────

const KEYWORD_SET = new Set(ALL_HIGHLIGHT_KEYWORDS.map(k => k.toUpperCase()));
const DOTTED_OPS = new Set([
  ...PPCL_RELATIONAL_OPS,
  ...PPCL_LOGICAL_OPS,
  ".ROOT.",
].map(o => o.toUpperCase()));

function highlightCode(code: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match dotted operators, keywords, numbers, and arithmetic operators
  const pattern = new RegExp(
    `(\\.(?:EQ|NE|GT|LT|GE|LE|AND|OR|NAND|XOR|ROOT)\\.)|(\\b(?:${ALL_HIGHLIGHT_KEYWORDS.join("|")})\\b)|(\\b\\d+\\.?\\d*\\b)|([+\\-*/=()><,&])`,
    "gi"
  );

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t${lastIndex}`} className="text-sky-300">
          {code.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      // Dotted operator (.EQ., .AND., etc.)
      parts.push(
        <span key={`d${match.index}`} className="text-rose-400 font-semibold">
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Keyword/command
      parts.push(
        <span key={`k${match.index}`} className="text-violet-400 font-semibold">
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Number
      parts.push(
        <span key={`n${match.index}`} className="text-amber-400">
          {match[0]}
        </span>
      );
    } else if (match[4]) {
      // Operator
      parts.push(
        <span key={`o${match.index}`} className="text-rose-400">
          {match[0]}
        </span>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < code.length) {
    parts.push(
      <span key={`r${lastIndex}`} className="text-sky-300">
        {code.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}

function highlightLine(line: string): React.ReactNode {
  // Full-line comment
  const commentMatch = line.match(/^(\s*\d*\s*)(C\s.*|C)$/i);
  if (commentMatch) {
    return (
      <>
        <span className="text-[var(--muted-foreground)]">{commentMatch[1]}</span>
        <span className="text-emerald-500 italic">{commentMatch[2]}</span>
      </>
    );
  }

  // Line number prefix
  const lineNumMatch = line.match(/^(\d+)(\s+)(.*)/);
  if (lineNumMatch) {
    return (
      <>
        <span className="text-[var(--muted-foreground)]">{lineNumMatch[1]}</span>
        {lineNumMatch[2]}
        {highlightCode(lineNumMatch[3])}
      </>
    );
  }

  return highlightCode(line);
}

// ─── Severity Styling ────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { bg: string; border: string; text: string; icon: string; label: string }> = {
  error:   { bg: "bg-red-500/10",   border: "border-red-500/30",   text: "text-red-400",   icon: "⛔", label: "Error" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "⚠️", label: "Warning" },
  info:    { bg: "bg-blue-500/10",  border: "border-blue-500/30",  text: "text-blue-400",  icon: "ℹ️", label: "Info" },
};

// ─── Sample Code ─────────────────────────────────────────────

const SAMPLE_CODE = `1000 C --- AHU-1 Supply Fan Control ---
1010 C Written for demonstration purposes
1020 IF (OATEMP.GT.85.0) THEN ON(SFAN1)
1030 IF (OATEMP.LT.65.0) THEN OFF(SFAN1)
1040 IF (SFAN1.EQ.ON) THEN ENABLE(2000,2100)
1050 ELSE DISABL(2000,2100)
1060 GOSUB 3000
1070 C
2000 C --- Cooling Sequence ---
2010 IF (SPACE1.GT.74.0) THEN ON(COOL1)
2020 IF (SPACE1.LT.72.0) THEN OFF(COOL1)
2100 C --- End Cooling ---
3000 C --- Alarm Check Subroutine ---
3010 IF (SFAN1.EQ.ON.AND.PRFON.NE.ON) THEN ALARM(SFAN1)
3020 RETURN`;

// ─── Component ───────────────────────────────────────────────

export default function PPCLAnalyzer() {
  const [code, setCode] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const analysis: LintResult | null = useMemo(() => {
    if (!code.trim()) return null;
    return lintPPCL(code);
  }, [code]);

  const filteredIssues = useMemo(() => {
    if (!analysis) return [];
    if (severityFilter === "all") return analysis.issues;
    return analysis.issues.filter(i => i.severity === severityFilter);
  }, [analysis, severityFilter]);

  const errorCount = analysis?.issues.filter(i => i.severity === "error").length ?? 0;
  const warningCount = analysis?.issues.filter(i => i.severity === "warning").length ?? 0;
  const infoCount = analysis?.issues.filter(i => i.severity === "info").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Code input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="ppcl-code" className="block text-sm font-medium">
            Paste your PPCL code
          </label>
          {!code && (
            <button
              onClick={() => setCode(SAMPLE_CODE)}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Load example
            </button>
          )}
        </div>
        <textarea
          id="ppcl-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={"1000 C --- AHU-1 Supply Fan Control ---\n1010 IF (OATEMP.GT.85.0) THEN ON(SFAN1)\n1020 IF (OATEMP.LT.65.0) THEN OFF(SFAN1)"}
          rows={14}
          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono text-sm resize-y"
          spellCheck={false}
        />
      </div>

      {analysis && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm">
              <span className="text-[var(--muted-foreground)]">Lines:</span>
              <span className="font-medium">{analysis.lineCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm">
              <span className="text-[var(--muted-foreground)]">Comments:</span>
              <span className="font-medium">{analysis.commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm">
              <span className="text-[var(--muted-foreground)]">Points:</span>
              <span className="font-medium">{analysis.points.length}</span>
            </div>
            <div className="flex-1" />
            {errorCount > 0 && (
              <button
                onClick={() => setSeverityFilter(severityFilter === "error" ? "all" : "error")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  severityFilter === "error" ? "bg-red-500/20 border-red-500/50" : "bg-red-500/10 border-red-500/30"
                } border text-red-400`}
              >
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={() => setSeverityFilter(severityFilter === "warning" ? "all" : "warning")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  severityFilter === "warning" ? "bg-amber-500/20 border-amber-500/50" : "bg-amber-500/10 border-amber-500/30"
                } border text-amber-400`}
              >
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </button>
            )}
            {infoCount > 0 && (
              <button
                onClick={() => setSeverityFilter(severityFilter === "info" ? "all" : "info")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  severityFilter === "info" ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-500/10 border-blue-500/30"
                } border text-blue-400`}
              >
                {infoCount} info
              </button>
            )}
            {analysis.issues.length === 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                All checks passed
              </div>
            )}
          </div>

          {/* Syntax highlighted output */}
          <div>
            <h3 className="text-sm font-medium mb-2">Highlighted Code</h3>
            <pre className="p-4 rounded-lg bg-[#0d1117] border border-[var(--border)] overflow-x-auto text-sm leading-6">
              {code.split("\n").map((line, idx) => (
                <div key={idx} className="hover:bg-white/5 -mx-4 px-4">
                  <span className="select-none text-[var(--muted-foreground)] mr-4 inline-block w-6 text-right text-xs">
                    {idx + 1}
                  </span>
                  {highlightLine(line)}
                </div>
              ))}
            </pre>
          </div>

          {/* Lint Issues */}
          {filteredIssues.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Lint Results ({filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""})
              </h3>
              <div className="space-y-2">
                {filteredIssues.map((issue, idx) => {
                  const sev = SEVERITY_CONFIG[issue.severity];
                  const ruleInfo = RULE_DESCRIPTIONS[issue.rule];
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-sm ${sev.bg} ${sev.border} ${sev.text}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0">{sev.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10">
                              {issue.rule}
                            </span>
                            {ruleInfo && (
                              <span className="text-xs opacity-70">
                                {ruleInfo.category}
                              </span>
                            )}
                            <span className="text-xs opacity-60">
                              Line {issue.line}
                              {issue.ppclLine ? ` (PPCL ${issue.ppclLine})` : ""}
                            </span>
                          </div>
                          <p className="mt-1">{issue.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Referenced Points */}
          {analysis.points.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Referenced Points ({analysis.points.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.points.map((point) => (
                  <span
                    key={point}
                    className="px-2.5 py-1 rounded-md bg-[var(--card)] border border-[var(--border)] text-sm font-mono"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
