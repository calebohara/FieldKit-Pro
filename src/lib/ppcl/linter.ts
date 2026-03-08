/**
 * PPCL Linter — Static validation engine for Siemens APOGEE PPCL programs.
 *
 * Rules sourced from: APOGEE PPCL User's Manual (125-1896, Rev. 6, May 2006)
 * - Chapter 1: Programming Methodology, General PPCL Rules, Design Guidelines
 * - Chapter 3: Command Syntax
 * - Appendix A: PPCL Reserved Word List
 */

// ─── Types ───────────────────────────────────────────────────

export type Severity = "error" | "warning" | "info";

export interface LintIssue {
  /** 1-based editor line */
  line: number;
  /** PPCL program line number (if present) */
  ppclLine?: number;
  severity: Severity;
  /** Rule identifier, e.g. "L001" */
  rule: string;
  message: string;
}

export interface LintResult {
  issues: LintIssue[];
  points: string[];
  lineCount: number;
  commentCount: number;
  /** Parsed PPCL line numbers for cross-referencing */
  ppclLineNumbers: number[];
}

// ─── PPCL Reserved Words (Appendix A — 125-1896 Rev. 6) ─────

/** All PPCL commands from Chapter 3 syntax reference */
export const PPCL_COMMANDS = [
  "ACT", "ADAPTM", "ADAPTS", "ALARM", "AUTO",
  "DAY", "DBSWIT", "DC", "DCR", "DEACT", "DEFINE", "DISABL", "DISALM", "DISCOV", "DPHONE",
  "EMAUTO", "EMFAST", "EMOFF", "EMON", "EMSET", "EMSLOW", "ENABLE", "ENALM", "ENCOV", "EPHONE",
  "FAST", "GOSUB", "GOTO",
  "HLIMIT", "HOLIDA",
  "IF", "INITTO",
  "LLIMIT", "LOCAL", "LOOP",
  "MAX", "MIN",
  "NIGHT", "NORMAL",
  "OFF", "OIP", "ON", "ONPWRT",
  "PDL", "PDLDAT", "PDLDPG", "PDLMTR", "PDLSET",
  "RELEAS", "RETURN",
  "SAMPLE", "SET", "SLOW", "SSTO", "SSTOCO", "STATE",
  "TABLE", "TIMAVG", "TOD", "TODMOD", "TODSET",
  "WAIT",
] as const;

/** Relational operators (dotted notation) */
export const PPCL_RELATIONAL_OPS = [
  ".EQ.", ".NE.", ".GT.", ".LT.", ".GE.", ".LE.",
] as const;

/** Logical operators (dotted notation) */
export const PPCL_LOGICAL_OPS = [
  ".AND.", ".OR.", ".NAND.", ".XOR.",
] as const;

/** Arithmetic functions */
export const PPCL_MATH_FUNCTIONS = [
  "ATN", "COM", "COS", "EXP", "LOG", ".ROOT.", "SIN", "SQRT", "TAN",
] as const;

/** Special functions */
export const PPCL_SPECIAL_FUNCTIONS = [
  "ALMPRI", "TOTAL",
] as const;

/** Resident points */
export const PPCL_RESIDENT_POINTS = [
  "ALMCNT", "ALMCT2", "$BATT", "CRTIME", "DAY", "DAYOFM",
  "LINK", "MONTH", "NODE", "$PDL", "SECNDS",
  "SECND1", "SECND2", "SECND3", "SECND4", "SECND5", "SECND6", "SECND7",
  "TIME",
] as const;

/** Point status indicators */
export const PPCL_STATUS_INDICATORS = [
  "ALARM", "ALMACK", "AUTO", "DEAD", "LOW", "OK",
  "DAYMOD", "FAILED", "FAST", "HAND", "NGTMOD",
  "OFF", "ON", "PRFON", "SLOW",
] as const;

/** Priority status indicators */
export const PPCL_PRIORITY_INDICATORS = [
  "@EMER", "@NONE", "@OPER", "@PDL", "@SMOKE",
] as const;

/** Local variables */
export const PPCL_LOCAL_VARS = [
  "$ARG1", "$ARG2", "$ARG3", "$ARG4", "$ARG5",
  "$ARG6", "$ARG7", "$ARG8", "$ARG9", "$ARG10",
  "$ARG11", "$ARG12", "$ARG13", "$ARG14", "$ARG15",
  "$LOC1", "$LOC2", "$LOC3", "$LOC4", "$LOC5",
  "$LOC6", "$LOC7", "$LOC8", "$LOC9", "$LOC10",
  "$LOC11", "$LOC12", "$LOC13", "$LOC14", "$LOC15",
] as const;

/** Control keywords (not commands but syntactic) */
export const PPCL_KEYWORDS = [
  "THEN", "ELSE",
] as const;

/**
 * Bare-form reserved words from Appendix A.
 * These are the operator/priority names without their dot or sigil prefixes,
 * listed separately in the manual's reserved word table.
 */
export const PPCL_BARE_RESERVED = [
  // Bare relational operators
  "EQ", "NE", "GT", "LT", "GE", "LE", "EQUAL",
  // Bare logical operators
  "AND", "OR", "NAND", "XOR", "NOR",
  // Bare math
  "ROOT",
  // Bare priority names
  "EMER", "NONE", "OPER", "SMOKE",
] as const;

/** Complete reserved word set for validation */
export const ALL_RESERVED_WORDS = new Set<string>([
  ...PPCL_COMMANDS,
  ...PPCL_RELATIONAL_OPS,
  ...PPCL_LOGICAL_OPS,
  ...PPCL_MATH_FUNCTIONS,
  ...PPCL_SPECIAL_FUNCTIONS,
  ...PPCL_RESIDENT_POINTS,
  ...PPCL_STATUS_INDICATORS,
  ...PPCL_PRIORITY_INDICATORS,
  ...PPCL_LOCAL_VARS,
  ...PPCL_KEYWORDS,
  ...PPCL_BARE_RESERVED,
  "C", // Comment line marker
]);

/** All keywords for syntax highlighting (commands + keywords + functions) */
export const ALL_HIGHLIGHT_KEYWORDS = [
  ...PPCL_COMMANDS,
  ...PPCL_KEYWORDS,
  ...PPCL_MATH_FUNCTIONS.filter(k => !k.startsWith(".")),
  ...PPCL_SPECIAL_FUNCTIONS,
] as const;

// ─── Constants from Manual ───────────────────────────────────

/** Valid PPCL line number range (manual §1-4) */
const LINE_NUM_MIN = 1;
const LINE_NUM_MAX = 32767;

/** Max chars per program line — APOGEE firmware (manual §1-4) */
const MAX_LINE_LENGTH = 80;

/** Max chars per comment line (manual §1-5) */
const MAX_COMMENT_LENGTH = 80;

/** Recommended line number spacing */
const RECOMMENDED_LINE_SPACING = 10;

/** Time-based commands that should execute every pass (manual §1-8) */
const TIME_BASED_COMMANDS = new Set(["LOOP", "SAMPLE", "TOD", "WAIT", "SSTO", "TIMAVG", "TODSET", "TODMOD"]);

// ─── Parser Helpers ──────────────────────────────────────────

interface ParsedLine {
  editorLine: number;       // 1-based line in the textarea
  ppclLineNum: number | null; // PPCL line number if present
  raw: string;              // Original text
  content: string;          // Without PPCL line number prefix
  isComment: boolean;
  isEmpty: boolean;
  isContinuation: boolean;  // Ends with &
}

function parseLine(raw: string, editorLine: number): ParsedLine {
  const trimmed = raw.trim();
  const isEmpty = trimmed.length === 0;

  // PPCL lines start with a numeric line number
  const lineNumMatch = trimmed.match(/^(\d+)\s+(.*)/);
  let ppclLineNum: number | null = null;
  let content = trimmed;

  if (lineNumMatch) {
    ppclLineNum = parseInt(lineNumMatch[1], 10);
    content = lineNumMatch[2];
  }

  // Comments: "C " at start of content (after line number)
  const isComment = /^C\s/i.test(content) || /^C$/i.test(content);
  const isContinuation = raw.trimEnd().endsWith("&");

  return { editorLine, ppclLineNum, raw, content, isComment, isEmpty, isContinuation };
}

// ─── Lint Rules ──────────────────────────────────────────────

function ruleLineNumberRange(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.ppclLineNum === null || p.isEmpty) continue;
    if (p.ppclLineNum < LINE_NUM_MIN || p.ppclLineNum > LINE_NUM_MAX) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum,
        severity: "error",
        rule: "L001",
        message: `Line number ${p.ppclLineNum} is out of range (valid: ${LINE_NUM_MIN}–${LINE_NUM_MAX})`,
      });
    }
  }
}

function ruleUniqueLineNumbers(parsed: ParsedLine[], issues: LintIssue[]) {
  const seen = new Map<number, number>(); // ppclLine -> editorLine
  for (const p of parsed) {
    if (p.ppclLineNum === null || p.isEmpty) continue;
    if (seen.has(p.ppclLineNum)) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum,
        severity: "error",
        rule: "L002",
        message: `Duplicate line number ${p.ppclLineNum} (first seen on editor line ${seen.get(p.ppclLineNum)})`,
      });
    } else {
      seen.set(p.ppclLineNum, p.editorLine);
    }
  }
}

function ruleLineNumberOrdering(parsed: ParsedLine[], issues: LintIssue[]) {
  let lastNum = -1;
  for (const p of parsed) {
    if (p.ppclLineNum === null || p.isEmpty) continue;
    if (p.ppclLineNum <= lastNum) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum,
        severity: "warning",
        rule: "L003",
        message: `Line number ${p.ppclLineNum} is not in ascending order (previous: ${lastNum})`,
      });
    }
    lastNum = p.ppclLineNum;
  }
}

function ruleLineNumberSpacing(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.ppclLineNum === null || p.isEmpty) continue;
    if (p.ppclLineNum % RECOMMENDED_LINE_SPACING !== 0) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum,
        severity: "info",
        rule: "L004",
        message: `Line number ${p.ppclLineNum} is not a multiple of 10 — may prevent inserting lines later`,
      });
    }
  }
}

function ruleMaxLineLength(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty) continue;
    const maxLen = p.isComment ? MAX_COMMENT_LENGTH : MAX_LINE_LENGTH;
    if (p.raw.length > maxLen) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "warning",
        rule: "L005",
        message: `Line is ${p.raw.length} characters (max ${maxLen} for ${p.isComment ? "comments" : "program lines"})`,
      });
    }
  }
}

function ruleCommentDensity(parsed: ParsedLine[], issues: LintIssue[]) {
  const codeLines = parsed.filter(p => !p.isEmpty && !p.isComment && p.ppclLineNum !== null);
  const commentLines = parsed.filter(p => p.isComment);

  if (codeLines.length >= 10 && commentLines.length === 0) {
    issues.push({
      line: 1,
      severity: "warning",
      rule: "D001",
      message: `Program has ${codeLines.length} code lines but no comment lines — add comments to document logic`,
    });
  }

  // Check for long uncommented stretches (20+ consecutive code lines)
  let streak = 0;
  let streakStart = 0;
  for (const p of parsed) {
    if (p.isEmpty) continue;
    if (p.isComment) {
      streak = 0;
    } else {
      if (streak === 0) streakStart = p.editorLine;
      streak++;
      if (streak === 20) {
        issues.push({
          line: streakStart,
          severity: "info",
          rule: "D002",
          message: `20+ consecutive code lines without comments starting here — consider adding documentation`,
        });
      }
    }
  }
}

function ruleGotoDirection(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty || p.isComment || p.ppclLineNum === null) continue;
    const upper = p.content.toUpperCase();
    // Manual syntax: GOTO line# (no parentheses)
    const gotoMatch = upper.match(/\bGOTO\s+(\d+)\b/);
    if (gotoMatch) {
      const target = parseInt(gotoMatch[1], 10);
      if (target < p.ppclLineNum) {
        issues.push({
          line: p.editorLine,
          ppclLine: p.ppclLineNum,
          severity: "warning",
          rule: "D003",
          message: `GOTO ${target} jumps backward from line ${p.ppclLineNum} — risk of infinite loop`,
        });
      }
    }
  }
}

function ruleComplexSingleLine(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    const upper = p.content.toUpperCase();

    // Count logical operators on a single line
    const logicalOps = (upper.match(/\.AND\.|\.OR\.|\.NAND\.|\.XOR\./g) || []).length;
    if (logicalOps >= 3) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "warning",
        rule: "D004",
        message: `Line has ${logicalOps} logical operators — consider splitting into multiple lines for readability`,
      });
    }

    // Nested IF on same line (IF...THEN...IF...THEN)
    const ifCount = (upper.match(/\bIF\b/g) || []).length;
    if (ifCount >= 2) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "warning",
        rule: "D005",
        message: "Nested IF on a single line — break into separate lines for maintainability",
      });
    }

    // Extremely long logic (multiple commands chained on one line via THEN...ELSE)
    const thenElseCount = (upper.match(/\bTHEN\b|\bELSE\b/g) || []).length;
    if (thenElseCount >= 3) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "info",
        rule: "D006",
        message: "Multiple THEN/ELSE clauses on one line — consider restructuring for clarity",
      });
    }
  }
}

function ruleGosubReturn(parsed: ParsedLine[], issues: LintIssue[]) {
  const gosubTargets: { target: number; editorLine: number; ppclLine: number }[] = [];
  const returnLines: number[] = [];
  const ppclLines = new Set<number>();

  for (const p of parsed) {
    if (p.ppclLineNum !== null) ppclLines.add(p.ppclLineNum);
    if (p.isEmpty || p.isComment) continue;
    const upper = p.content.toUpperCase();

    // Manual syntax: GOSUB line# (space-separated, no parentheses around line#)
    const gosubMatch = upper.match(/\bGOSUB\s+(\d+)\b/);
    if (gosubMatch && p.ppclLineNum !== null) {
      gosubTargets.push({
        target: parseInt(gosubMatch[1], 10),
        editorLine: p.editorLine,
        ppclLine: p.ppclLineNum,
      });
    }

    if (/\bRETURN\b/.test(upper)) {
      returnLines.push(p.editorLine);
    }
  }

  // Check that GOSUB targets exist
  for (const g of gosubTargets) {
    if (!ppclLines.has(g.target)) {
      issues.push({
        line: g.editorLine,
        ppclLine: g.ppclLine,
        severity: "error",
        rule: "S001",
        message: `GOSUB target line ${g.target} does not exist in program`,
      });
    }
  }

  // Check that GOSUBs have matching RETURNs
  if (gosubTargets.length > 0 && returnLines.length === 0) {
    issues.push({
      line: gosubTargets[0].editorLine,
      ppclLine: gosubTargets[0].ppclLine,
      severity: "warning",
      rule: "S002",
      message: "GOSUB used but no RETURN statement found — subroutine may not return",
    });
  }
}

function ruleTimeBased(parsed: ParsedLine[], issues: LintIssue[]) {
  // If a time-based command is inside a GOTOable section (after a GOTO skip),
  // warn that it might not execute every pass.
  // Simplified: check if DEACT/DISABL is used on a range containing time-based cmds
  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    const upper = p.content.toUpperCase();

    for (const cmd of TIME_BASED_COMMANDS) {
      if (new RegExp(`\\b${cmd}\\b`).test(upper)) {
        // Check if this line is behind a GOTO that skips over it
        // We do a simplified check: warn if time command is after a conditional GOTO
        // This is an approximation — real flow analysis would need a CFG
        break; // No false positives — skip complex flow analysis
      }
    }
  }
}

function ruleMissingLineNumbers(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    // Non-empty, non-comment line without a PPCL line number
    if (p.ppclLineNum === null && p.content.length > 0) {
      // Only flag if it looks like code (not just whitespace)
      const looksLikeCode = /[A-Z]/i.test(p.content);
      if (looksLikeCode) {
        issues.push({
          line: p.editorLine,
          severity: "warning",
          rule: "L006",
          message: "Code line has no PPCL line number — every statement needs a line number",
        });
      }
    }
  }
}

function ruleActDeactTargets(parsed: ParsedLine[], issues: LintIssue[]) {
  const ppclLines = new Set<number>();
  for (const p of parsed) {
    if (p.ppclLineNum !== null) ppclLines.add(p.ppclLineNum);
  }

  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    const upper = p.content.toUpperCase();

    // Manual syntax: ACT(line1,...,line16) — individual line numbers, NOT a range
    const cmdMatch = upper.match(/\b(ACT|DEACT|DISABL|ENABLE)\s*\(([^)]+)\)/);
    if (cmdMatch) {
      const cmd = cmdMatch[1];
      const args = cmdMatch[2].split(",").map(s => s.trim()).filter(Boolean);

      for (const arg of args) {
        const lineNum = parseInt(arg, 10);
        if (isNaN(lineNum)) continue; // skip non-numeric args
        if (!ppclLines.has(lineNum)) {
          issues.push({
            line: p.editorLine,
            ppclLine: p.ppclLineNum ?? undefined,
            severity: "warning",
            rule: "S004",
            message: `${cmd} target line ${lineNum} does not exist in program`,
          });
        }
      }
    }
  }
}

function ruleGotoTargets(parsed: ParsedLine[], issues: LintIssue[]) {
  const ppclLines = new Set<number>();
  for (const p of parsed) {
    if (p.ppclLineNum !== null) ppclLines.add(p.ppclLineNum);
  }

  for (const p of parsed) {
    if (p.isEmpty || p.isComment || p.ppclLineNum === null) continue;
    const upper = p.content.toUpperCase();
    const gotoMatch = upper.match(/\bGOTO\s+(\d+)\b/);
    if (gotoMatch) {
      const target = parseInt(gotoMatch[1], 10);
      if (!ppclLines.has(target)) {
        issues.push({
          line: p.editorLine,
          ppclLine: p.ppclLineNum,
          severity: "error",
          rule: "S003",
          message: `GOTO target line ${target} does not exist in program`,
        });
      }
    }
  }
}

function ruleParenthesesBalance(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    let depth = 0;
    for (const ch of p.content) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth < 0) break;
    }
    if (depth !== 0) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "error",
        rule: "S005",
        message: depth > 0
          ? `Unclosed parenthesis — ${depth} opening '(' without matching ')'`
          : `Extra closing ')' without matching '('`,
      });
    }
  }
}

function ruleIfThenStructure(parsed: ParsedLine[], issues: LintIssue[]) {
  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    const upper = p.content.toUpperCase();

    // IF without THEN (and not a continuation line)
    if (/\bIF\b/.test(upper) && !/\bTHEN\b/.test(upper) && !p.isContinuation) {
      // Check if next non-empty line is a continuation
      // Simple check: flag it as warning
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "warning",
        rule: "S006",
        message: "IF statement without THEN on same line — verify continuation or add THEN clause",
      });
    }

    // THEN with nothing after it (empty body)
    if (/\bTHEN\s*$/.test(upper) && !p.isContinuation) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "warning",
        rule: "S007",
        message: "THEN clause is empty — missing command after THEN",
      });
    }
  }
}

/** Detect lines that start with a word that is not a known PPCL command or keyword */
function ruleUnknownCommand(parsed: ParsedLine[], issues: LintIssue[]) {
  const knownStarters = new Set<string>([
    ...PPCL_COMMANDS,
    ...PPCL_KEYWORDS,
    "C",   // comment marker
  ]);

  for (const p of parsed) {
    if (p.isEmpty || p.isComment || p.ppclLineNum === null) continue;
    const content = p.content.trim();
    // Get first word of the content (the statement keyword)
    const firstWordMatch = content.match(/^([A-Z$@][A-Z0-9]*)\b/i);
    if (!firstWordMatch) continue;
    const firstWord = firstWordMatch[1].toUpperCase();

    // Skip if it's a known command/keyword
    if (knownStarters.has(firstWord)) continue;
    // Skip if it looks like an assignment (point = value)
    if (/^[A-Z$@][A-Z0-9_\-]*\s*=/i.test(content)) continue;
    // Skip ELSE at start (it's in PPCL_KEYWORDS already but check)
    if (firstWord === "ELSE") continue;

    issues.push({
      line: p.editorLine,
      ppclLine: p.ppclLineNum,
      severity: "warning",
      rule: "S008",
      message: `Statement starts with '${firstWord}' which is not a recognized PPCL command`,
    });
  }
}

function ruleOnpwrtPlacement(parsed: ParsedLine[], issues: LintIssue[]) {
  let firstCodeLine: ParsedLine | null = null;
  let onpwrtLine: ParsedLine | null = null;

  for (const p of parsed) {
    if (p.isEmpty || p.isComment || p.ppclLineNum === null) continue;
    if (!firstCodeLine) firstCodeLine = p;
    if (/\bONPWRT\b/i.test(p.content) && !onpwrtLine) {
      onpwrtLine = p;
    }
  }

  if (onpwrtLine && firstCodeLine && onpwrtLine.editorLine !== firstCodeLine.editorLine) {
    issues.push({
      line: onpwrtLine.editorLine,
      ppclLine: onpwrtLine.ppclLineNum ?? undefined,
      severity: "info",
      rule: "D007",
      message: "ONPWRT should typically be the first executable statement in a PPCL program",
    });
  }
}

function ruleContinuationLine(parsed: ParsedLine[], issues: LintIssue[]) {
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    if (p.isEmpty || p.isComment) continue;
    if (!p.isContinuation) continue;

    // Check if there is a next non-empty line
    let hasNext = false;
    for (let j = i + 1; j < parsed.length; j++) {
      if (!parsed[j].isEmpty) { hasNext = true; break; }
    }
    if (!hasNext) {
      issues.push({
        line: p.editorLine,
        ppclLine: p.ppclLineNum ?? undefined,
        severity: "error",
        rule: "S009",
        message: "Line ends with continuation '&' but there is no following line",
      });
    }
  }
}

// ─── Point Extraction ────────────────────────────────────────

function extractPoints(parsed: ParsedLine[]): string[] {
  const points = new Set<string>();
  const reservedUpper = new Set([...ALL_RESERVED_WORDS].map(w => w.toUpperCase()));

  for (const p of parsed) {
    if (p.isEmpty || p.isComment) continue;
    // Extract individual identifiers (no dots — split expressions like OATEMP.GT.85.0)
    const tokens = p.content.match(/\b[A-Z$@][A-Z0-9_\-]*\b/gi) || [];
    for (const token of tokens) {
      const upper = token.toUpperCase();
      // Skip reserved words, pure numbers, local vars
      if (reservedUpper.has(upper)) continue;
      if (/^\d+$/.test(token)) continue;
      if (/^\$ARG\d+$/i.test(token) || /^\$LOC\d+$/i.test(token)) continue;
      // Skip dotted operator fragments
      if (/^(EQ|NE|GT|LT|GE|LE|AND|OR|NAND|XOR|ROOT)$/i.test(token)) continue;
      // Skip single-char tokens (operators, etc.)
      if (token.length < 2) continue;
      // Likely a point name
      points.add(upper);
    }
  }

  return Array.from(points).sort();
}

// ─── Main Lint Function ──────────────────────────────────────

export function lintPPCL(code: string): LintResult {
  const rawLines = code.split("\n");
  const parsed = rawLines.map((raw, idx) => parseLine(raw, idx + 1));

  const issues: LintIssue[] = [];

  // Run all rules
  ruleLineNumberRange(parsed, issues);
  ruleUniqueLineNumbers(parsed, issues);
  ruleLineNumberOrdering(parsed, issues);
  ruleLineNumberSpacing(parsed, issues);
  ruleMaxLineLength(parsed, issues);
  ruleMissingLineNumbers(parsed, issues);
  ruleCommentDensity(parsed, issues);
  ruleGotoDirection(parsed, issues);
  ruleComplexSingleLine(parsed, issues);
  ruleGosubReturn(parsed, issues);
  ruleGotoTargets(parsed, issues);
  ruleActDeactTargets(parsed, issues);
  ruleParenthesesBalance(parsed, issues);
  ruleIfThenStructure(parsed, issues);
  ruleUnknownCommand(parsed, issues);
  ruleOnpwrtPlacement(parsed, issues);
  ruleContinuationLine(parsed, issues);
  ruleTimeBased(parsed, issues);

  // Sort by editor line, then severity (error > warning > info)
  const sevOrder: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => a.line - b.line || sevOrder[a.severity] - sevOrder[b.severity]);

  return {
    issues,
    points: extractPoints(parsed),
    lineCount: parsed.filter(p => !p.isEmpty).length,
    commentCount: parsed.filter(p => p.isComment).length,
    ppclLineNumbers: parsed
      .filter(p => p.ppclLineNum !== null)
      .map(p => p.ppclLineNum!),
  };
}

// ─── Rule Descriptions (for UI) ──────────────────────────────

export const RULE_DESCRIPTIONS: Record<string, { name: string; category: string }> = {
  L001: { name: "Line number out of range", category: "Line Numbers" },
  L002: { name: "Duplicate line number", category: "Line Numbers" },
  L003: { name: "Line number ordering", category: "Line Numbers" },
  L004: { name: "Line number spacing", category: "Line Numbers" },
  L005: { name: "Line too long", category: "Line Length" },
  L006: { name: "Missing line number", category: "Line Numbers" },
  D001: { name: "No comments in program", category: "Design Guidelines" },
  D002: { name: "Long uncommented stretch", category: "Design Guidelines" },
  D003: { name: "Backward GOTO", category: "Design Guidelines" },
  D004: { name: "Complex single-line logic", category: "Design Guidelines" },
  D005: { name: "Nested IF on one line", category: "Design Guidelines" },
  D006: { name: "Dense THEN/ELSE chain", category: "Design Guidelines" },
  S001: { name: "GOSUB target missing", category: "Subroutines" },
  S002: { name: "Missing RETURN", category: "Subroutines" },
  S003: { name: "GOTO target missing", category: "Program Flow" },
  S004: { name: "Target line missing", category: "Subroutines" },
  S005: { name: "Unbalanced parentheses", category: "Syntax" },
  S006: { name: "IF without THEN", category: "Syntax" },
  S007: { name: "Empty THEN clause", category: "Syntax" },
  S008: { name: "Unknown command", category: "Syntax" },
  S009: { name: "Dangling continuation", category: "Syntax" },
  D007: { name: "ONPWRT placement", category: "Design Guidelines" },
};
