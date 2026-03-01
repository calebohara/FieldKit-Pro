"use client";

import { useState, useMemo } from "react";

// PPCL keywords for syntax highlighting
const KEYWORDS = [
  "IF", "THEN", "ELSE", "ENDIF", "DO", "ENDDO", "GOTO", "GOSUB", "RETURN",
  "SET", "ENABLE", "DISABLE", "ON", "OFF", "AUTO", "START", "STOP",
  "DEFINE", "LOCAL", "ADAPT", "ALARM", "EMERG", "TODMOD", "HOLMOD", "RUNMOD",
  "DBSWIT", "LOOP", "TABLE", "SIDSID", "WAIT", "SAMPLE",
  "EQ", "NE", "GT", "LT", "GE", "LE", "AND", "OR", "NOT", "XOR",
  "ACT", "DEACT", "FAST", "SLOW", "MIN", "MAX", "DAY", "NIGHT",
];

const OPERATORS = ["\\+", "\\-", "\\*", "\\/", "=", "\\(", "\\)"];

interface AnalysisIssue {
  line: number;
  type: "error" | "warning" | "info";
  message: string;
}

interface AnalysisResult {
  issues: AnalysisIssue[];
  points: string[];
  lineCount: number;
}

// Analyze PPCL code for common issues
function analyzePPCL(code: string): AnalysisResult {
  const lines = code.split("\n");
  const issues: AnalysisIssue[] = [];
  const points = new Set<string>();

  let ifCount = 0;
  let doCount = 0;
  let gosubWithoutReturn = false;
  let hasReturn = false;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim().toUpperCase();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("C ") || trimmed.startsWith("C\t")) return;

    // Strip line numbers from start (PPCL uses line numbers like "01000 IF...")
    const withoutLineNum = trimmed.replace(/^\d+\s+/, "");

    // Track IF/ENDIF balance
    if (/\bIF\b/.test(withoutLineNum) && /\bTHEN\b/.test(withoutLineNum)) {
      ifCount++;
    }
    if (/\bENDIF\b/.test(withoutLineNum)) {
      ifCount--;
      if (ifCount < 0) {
        issues.push({ line: lineNum, type: "error", message: "ENDIF without matching IF" });
        ifCount = 0;
      }
    }

    // Track DO/ENDDO balance
    if (/\bDO\b/.test(withoutLineNum) && !/\bENDDO\b/.test(withoutLineNum)) {
      doCount++;
    }
    if (/\bENDDO\b/.test(withoutLineNum)) {
      doCount--;
      if (doCount < 0) {
        issues.push({ line: lineNum, type: "error", message: "ENDDO without matching DO" });
        doCount = 0;
      }
    }

    // Track GOSUB/RETURN
    if (/\bGOSUB\b/.test(withoutLineNum)) {
      gosubWithoutReturn = true;
    }
    if (/\bRETURN\b/.test(withoutLineNum)) {
      hasReturn = true;
    }

    // Detect point references (typical format: "POINTNAME" or references after SET, ENABLE, etc.)
    // PPCL points are typically uppercase identifiers, often with dots or hyphens
    const pointPattern = /\b([A-Z][A-Z0-9]*(?:[._-][A-Z0-9]+)+)\b/g;
    let match;
    while ((match = pointPattern.exec(trimmed)) !== null) {
      points.add(match[1]);
    }

    // Check for potential line number issues (duplicate or out of order)
    const lineNumMatch = line.match(/^(\d+)\s/);
    if (lineNumMatch) {
      const num = parseInt(lineNumMatch[1]);
      if (num % 10 !== 0) {
        issues.push({
          line: lineNum,
          type: "warning",
          message: `Line number ${num} is not a multiple of 10 — may cause insertion difficulties`,
        });
      }
    }

    // Check for very long lines
    if (line.length > 80) {
      issues.push({
        line: lineNum,
        type: "warning",
        message: "Line exceeds 80 characters — may cause issues on some controllers",
      });
    }
  });

  // End-of-file checks
  if (ifCount > 0) {
    issues.push({
      line: lines.length,
      type: "error",
      message: `${ifCount} unclosed IF statement${ifCount > 1 ? "s" : ""} — missing ENDIF`,
    });
  }
  if (doCount > 0) {
    issues.push({
      line: lines.length,
      type: "error",
      message: `${doCount} unclosed DO loop${doCount > 1 ? "s" : ""} — missing ENDDO`,
    });
  }
  if (gosubWithoutReturn && !hasReturn) {
    issues.push({
      line: lines.length,
      type: "warning",
      message: "GOSUB found but no RETURN statement — subroutine may not return properly",
    });
  }

  return {
    issues,
    points: Array.from(points).sort(),
    lineCount: lines.filter((l) => l.trim()).length,
  };
}

// Apply syntax highlighting to a line of PPCL code
function highlightLine(line: string): React.ReactNode {
  // Build a regex that matches keywords, strings, numbers, comments, and operators
  const keywordPattern = `\\b(${KEYWORDS.join("|")})\\b`;
  const numberPattern = `\\b(\\d+\\.?\\d*)\\b`;
  const commentPattern = `(^\\s*C\\s.*)`;
  const operatorPattern = `(${OPERATORS.join("|")})`;
  const lineNumPattern = `^(\\d+)(\\s)`;

  // Check if line is a comment
  if (/^\s*C\s/i.test(line)) {
    return <span className="text-emerald-500 italic">{line}</span>;
  }

  // Highlight line number prefix
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

function highlightCode(code: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const pattern = new RegExp(
    `(\\b(?:${KEYWORDS.join("|")})\\b)|(\\b\\d+\\.?\\d*\\b)|([+\\-*/=()><])`,
    "gi"
  );

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(code)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t${lastIndex}`} className="text-sky-300">
          {code.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      // Keyword
      parts.push(
        <span key={`k${match.index}`} className="text-violet-400 font-semibold">
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Number
      parts.push(
        <span key={`n${match.index}`} className="text-amber-400">
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Operator
      parts.push(
        <span key={`o${match.index}`} className="text-rose-400">
          {match[0]}
        </span>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Remaining text
  if (lastIndex < code.length) {
    parts.push(
      <span key={`r${lastIndex}`} className="text-sky-300">
        {code.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}

export default function PPCLAnalyzer() {
  const [code, setCode] = useState("");

  const analysis = useMemo(() => {
    if (!code.trim()) return null;
    return analyzePPCL(code);
  }, [code]);

  return (
    <div className="space-y-6">
      {/* Code input */}
      <div>
        <label htmlFor="ppcl-code" className="block text-sm font-medium mb-2">
          Paste your PPCL code
        </label>
        <textarea
          id="ppcl-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={"01000 IF (TEMP.SPACE GT 74) THEN ON(COOL.VLV)\n01010 ELSE OFF(COOL.VLV)\n01020 ENDIF"}
          rows={12}
          className="w-full px-4 py-3 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono text-sm resize-y"
        />
      </div>

      {analysis && (
        <>
          {/* Syntax highlighted output */}
          <div>
            <h3 className="text-sm font-medium mb-2">Highlighted Code</h3>
            <pre className="p-4 rounded-lg bg-[#0d1117] border border-[var(--border)] overflow-x-auto text-sm leading-6">
              {code.split("\n").map((line, idx) => (
                <div key={idx}>
                  <span className="select-none text-[var(--muted-foreground)] mr-4 inline-block w-6 text-right text-xs">
                    {idx + 1}
                  </span>
                  {highlightLine(line)}
                </div>
              ))}
            </pre>
          </div>

          {/* Issues */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Analysis ({analysis.issues.length} issue{analysis.issues.length !== 1 ? "s" : ""} found)
            </h3>
            {analysis.issues.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                No issues detected — code looks clean.
              </div>
            ) : (
              <div className="space-y-2">
                {analysis.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm ${
                      issue.type === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : issue.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}
                  >
                    <span className="font-medium">Line {issue.line}:</span>{" "}
                    {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referenced Points */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Referenced Points ({analysis.points.length})
            </h3>
            {analysis.points.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No point references detected.
              </p>
            ) : (
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
            )}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            {analysis.lineCount} non-empty lines · {analysis.points.length} point
            references · {analysis.issues.filter((i) => i.type === "error").length} errors
            · {analysis.issues.filter((i) => i.type === "warning").length} warnings
          </div>
        </>
      )}
    </div>
  );
}
