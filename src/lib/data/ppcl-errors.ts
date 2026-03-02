/**
 * PPCL (Powers Process Control Language) Common Errors Reference
 * For use with Siemens APOGEE building automation systems.
 *
 * Source: APOGEE PPCL User's Manual (125-1896, Rev. 6, May 2006)
 * Errors are based on common issues encountered during PPCL program
 * development, upload, and runtime execution on Siemens APOGEE and
 * BACnet field panels.
 *
 * Usage:
 *   import { ppclErrors, PPCLError } from '$lib/data/ppcl-errors';
 */

export interface PPCLError {
  id: number;
  error: string;
  symptoms: string;
  rootCause: string;
  fix: string;
  category: string;
}

export const ppclErrors: PPCLError[] = [
  // ── Syntax Errors ─────────────────────────────────────────────────────────
  {
    id: 1,
    error: "Duplicate Line Number",
    symptoms:
      "Program upload fails or field panel rejects the download. Editor may flag a duplicate line number conflict. GOTO and GOSUB targets may resolve to the wrong line.",
    rootCause:
      "Two or more PPCL statements share the same line number. PPCL requires every statement to have a unique line number (valid range: 1 to 32,767). Duplicate numbers confuse the compiler's jump-table resolution.",
    fix: "Audit all line numbers in the program to ensure uniqueness. Use the editor's renumber function if available. Number lines in multiples of 10 (10, 20, 30...) so modifications can be inserted without renumbering. Update all GOTO and GOSUB references to match corrected line numbers.",
    category: "Syntax",
  },
  {
    id: 2,
    error: "Line Number Out of Range",
    symptoms:
      "Compile error on the offending line. Program will not download to the field panel.",
    rootCause:
      "A PPCL line number is outside the valid range of 1 through 32,767. This can occur when auto-numbering exceeds the limit or when manually entering line numbers.",
    fix: "Ensure all line numbers fall within 1-32,767. If the program has grown too large, consider splitting it into multiple smaller programs. Renumber from a lower starting point using multiples of 10.",
    category: "Syntax",
  },
  {
    id: 3,
    error: "Line Too Long",
    symptoms:
      "Characters are truncated when entering the program line. The program may compile but execute incorrectly due to the truncation.",
    rootCause:
      "APOGEE firmware limits each program line to 66 characters including the line number when entered through the HMI or MMI port. Pre-APOGEE firmware allows 72 characters. If more characters are needed, use the ampersand (&) continuation character.",
    fix: "Break long lines using the ampersand (&) at the end of the first line and continue on the next. APOGEE allows up to three continued lines (198 total characters including ampersands and line numbers). Pre-APOGEE allows two continued lines (144 total characters).",
    category: "Syntax",
  },
  {
    id: 4,
    error: "GOSUB Without RETURN",
    symptoms:
      "Program execution falls through the end of a subroutine into subsequent code. Unexpected logic branches occur and outputs may be commanded incorrectly. The field panel may log a stack fault.",
    rootCause:
      "A GOSUB statement transfers execution to a subroutine, but the subroutine does not terminate with a RETURN statement. Without RETURN, the controller continues executing code sequentially past the subroutine end.",
    fix: "Locate every GOSUB target line and verify that each subroutine block ends with a RETURN statement before the next logical block begins. Add missing RETURN statements. Add comment lines to clearly mark subroutine boundaries.",
    category: "Syntax",
  },
  {
    id: 5,
    error: "Reserved Word Used as Point Name",
    symptoms:
      "Program does not operate properly. The field panel may interpret the point name as a command, causing unexpected behavior. Compile may succeed but runtime execution is incorrect.",
    rootCause:
      "A point name matches a PPCL reserved word from Appendix A of the manual (e.g., TIME, DAY, ALARM, ON, OFF, SET, AUTO, etc.). The PPCL compiler treats these names as commands rather than point references.",
    fix: "Rename the point to avoid all PPCL reserved words (see Appendix A of the PPCL User's Manual). Use descriptive names that include a prefix or suffix to differentiate from reserved words (e.g., use OATEMP instead of TEMP, SFAN1 instead of FAN). Update the point database and all program references.",
    category: "Syntax",
  },
  {
    id: 6,
    error: "Point Name Requires Quotes",
    symptoms:
      "Compile error referencing the point name. Program will not download. The point cannot be resolved in the database.",
    rootCause:
      "PPCL point names greater than 6 characters or containing characters other than A-Z and 0-9 must be enclosed in double quotes. APOGEE firmware supports names up to 30 characters with letters, numbers, spaces, periods, commas, dashes, underlines, and apostrophes.",
    fix: 'Enclose the point name in double quotes in the PPCL program. Example: ON("BUILDING1.AHU01.SFAN"). For pre-APOGEE firmware, point names are limited to 6 characters using only A-Z and 0-9.',
    category: "Syntax",
  },

  // ── Runtime Errors ────────────────────────────────────────────────────────
  {
    id: 7,
    error: "Backward GOTO Causing Infinite Loop",
    symptoms:
      "Program scan time climbs until the watchdog timer fires and the field panel resets or the program is faulted. Other programs on the same panel may stop executing.",
    rootCause:
      "A GOTO statement transfers execution to a lower line number, creating a loop that never reaches the end of the program. Per the PPCL Design Guidelines, routing commands should always transfer to a sequentially higher line number to prevent endless loops.",
    fix: "Restructure the program so all GOTO statements transfer to higher line numbers. Use IF/THEN/ELSE conditional logic instead of GOTO loops where possible. If a loop is needed, use time-based commands (LOOP, WAIT, SAMPLE) to control execution frequency.",
    category: "Runtime",
  },
  {
    id: 8,
    error: "Time-Based Command Not Evaluated Every Pass",
    symptoms:
      "LOOP, WAIT, SAMPLE, TOD, or SSTO commands execute at incorrect intervals or not at all. Scheduled events fire at wrong times. Equipment starts/stops unexpectedly.",
    rootCause:
      "Time-based commands (LOOP, SAMPLE, TOD, TODSET, WAIT, SSTO) must be evaluated through every pass of the program for proper operation. If these commands are inside a conditional block (IF/THEN) or deactivated line range, they may be skipped during some program passes.",
    fix: "Move all time-based commands outside of conditional blocks so they are evaluated on every program pass. Place them in the main execution path of the program, not inside IF/THEN blocks or line ranges controlled by ACT/DEACT.",
    category: "Runtime",
  },
  {
    id: 9,
    error: "First Line Not Executed Every Pass",
    symptoms:
      "After a power failure or program restart, the program does not initialize correctly. Equipment remains in an unknown state. ONPWRT command does not execute as expected.",
    rootCause:
      "For Unitary and pre-APOGEE firmware, the last line of the program must be executed on every pass, and program execution always resumes at the first line after an interruption. If the first line is inside a conditional block or deactivated range, initialization logic may be skipped.",
    fix: "Ensure the first line of the program is always executed on every pass. Place initialization commands (like ONPWRT) at the very beginning of the program. Do not place the first line inside a conditional block or a range controlled by ACT/DEACT/ENABLE/DISABL.",
    category: "Runtime",
  },
  {
    id: 10,
    error: "Program Too Large for Memory",
    symptoms:
      "Download fails with a memory error. The field panel refuses to accept the program. Previously downloaded programs continue to run.",
    rootCause:
      "The PPCL program exceeds the available program memory on the field panel. The maximum number of program lines is limited by the free memory of the device. Multiple large programs on the same panel compound the issue.",
    fix: "Split the program into multiple smaller programs of roughly equal size. Remove unused code and comments (comments consume memory). Use DEFINE abbreviations to shorten repeated long point names. For APOGEE panels, multiple programs can run independently.",
    category: "Runtime",
  },
  {
    id: 11,
    error: "Cross-Panel Control Failure",
    symptoms:
      "Commands sent to points on another field panel are ignored or produce unpredictable results. Shared point values show stale or incorrect data.",
    rootCause:
      "PPCL Design Guidelines state that a program defined in one field panel should not be used to control points in a different field panel. Loop statements should not be closed across a network. Network communication latency causes timing issues.",
    fix: "Restructure the control logic so each field panel's program only controls points in its own database. Use network-shared global points for coordination between panels rather than direct cross-panel commands.",
    category: "Runtime",
  },

  // ── Point Issues ──────────────────────────────────────────────────────────
  {
    id: 12,
    error: "Point Not in Database",
    symptoms:
      "Runtime error: undefined point or point not found. The program may halt or skip the affected statement. Output points depending on the missing point default to zero.",
    rootCause:
      "The program references a point name that does not exist in the field panel's point database. All physical and virtual points used in the program must be defined in the point database. Common causes include typos, deleted points, or copying programs between panels without updating point names.",
    fix: "Verify the exact spelling of the point name in the field panel's database. For APOGEE firmware, point names up to 30 characters are valid. For pre-APOGEE, names are limited to 6 characters (A-Z, 0-9 only). Correct the reference in the program. Point names starting with numbers must be prefixed with @.",
    category: "Point Issues",
  },
  {
    id: 13,
    error: "Point Override Stuck (HAND Mode)",
    symptoms:
      "A point remains in manually overridden state regardless of PPCL program commands. The point status shows HAND. The controlled device does not respond to automatic control.",
    rootCause:
      "An operator or technician manually overrode the point at the field panel HMI/MMI or through the front-end. PPCL program writes to an overridden (HAND) point are silently ignored. The HAND priority takes precedence over PPCL commands.",
    fix: "Release the manual override by setting the point back to AUTO at the HMI/MMI or front-end. Confirm the program resumes control. Consider using the PPCL AUTO() command in the program to automatically clear overrides under specific conditions. Document the override event.",
    category: "Point Issues",
  },
  {
    id: 14,
    error: "Priority Conflict",
    symptoms:
      "A point's value is unexpectedly controlled by a source other than the PPCL program. The program's writes appear to be ignored. Emergency commands override normal PPCL control.",
    rootCause:
      "PPCL uses a priority system with levels including @NONE (PPCL default), @OPER (operator), @PDL (peak demand limiting), @EMER (emergency), and @SMOKE (smoke control). Higher-priority sources override lower-priority PPCL commands. Emergency commands (EMON, EMOFF, EMFAST, EMSLOW, EMAUTO, EMSET) write at @EMER priority.",
    fix: "Review the point's priority status using @ priority indicators. Use RELEAS() to release PPCL control if needed. Ensure emergency sequences properly release points after the emergency condition clears. Establish a clear priority convention across all programs.",
    category: "Point Issues",
  },
  {
    id: 15,
    error: "Analog Point EQ Comparison Fails",
    symptoms:
      "An IF condition using .EQ. on an analog point never evaluates to true, even when the point appears to be at the compared value. Control logic dependent on the comparison never executes.",
    rootCause:
      "Analog input points may contain precise decimal values (e.g., 79.9876). When comparing with .EQ. to a whole number (80.0), the result is false because the values are not identical. The PPCL manual warns about this for analog inputs.",
    fix: "Use range-based comparisons (.GT., .LT., .GE., .LE.) instead of .EQ. for analog points. For example, instead of IF (RMTEMP.EQ.80.0), use IF (RMTEMP.GE.79.5.AND.RMTEMP.LE.80.5). Reserve .EQ. for digital/binary point comparisons (ON, OFF) and known exact values.",
    category: "Point Issues",
  },
  {
    id: 16,
    error: "FAILED Point Status",
    symptoms:
      "A point displays FAILED status. The point value may read zero or last known good value. Control logic depending on the point produces incorrect results.",
    rootCause:
      "The FAILED status indicator means the field panel cannot communicate with the physical device connected to the point (sensor, actuator, etc.). Causes include wiring faults, failed devices, or communication bus errors.",
    fix: "Check physical wiring between the field panel and the device. Verify the device is powered and functioning. Check for FLN bus communication issues. Use the point status indicator in PPCL to add fallback logic: IF (SENSOR.EQ.FAILED) THEN use a default value.",
    category: "Point Issues",
  },

  // ── Program Flow ──────────────────────────────────────────────────────────
  {
    id: 17,
    error: "Unequal Program Execution Rates",
    symptoms:
      "When multiple programs run on the same APOGEE field panel, shorter programs execute more frequently than longer ones. A 10-line program executes five times before a 50-line program completes once.",
    rootCause:
      "APOGEE field panels sequentially execute one line of each enabled program in a round-robin fashion. Programs with fewer lines complete faster and restart sooner. This causes uneven execution rates when programs have very different lengths.",
    fix: "Create programs that are roughly the same number of lines. Pad shorter programs with comment lines if needed. Consider consolidating very short programs into a single larger program. Be aware that time-based commands may behave differently in short vs. long programs.",
    category: "Program Flow",
  },
  {
    id: 18,
    error: "Subroutine Call Stack Overflow",
    symptoms:
      "Field panel watchdog trips. Program is marked as faulted. Other programs on the panel may be delayed or stopped.",
    rootCause:
      "Nested GOSUB calls exceed the field panel's call stack depth. This can occur from deeply nested subroutines or circular subroutine calls where subroutine A calls B which calls A. The $ARG1-$ARG15 parameter passing mechanism shares state across the call stack.",
    fix: "Map the call graph of all GOSUB statements. Eliminate circular call chains. Reduce nesting depth. Use $LOC1-$LOC15 local variables instead of $ARG variables when possible to avoid parameter conflicts in nested calls. Each subroutine must end with RETURN.",
    category: "Program Flow",
  },
  {
    id: 19,
    error: "ACT/DEACT Range Overlap",
    symptoms:
      "A line range that should be deactivated continues to execute, or a range that should be active is unexpectedly deactivated. Equipment control becomes unpredictable.",
    rootCause:
      "Multiple ACT and DEACT commands reference overlapping line ranges. When ranges overlap, the last command to execute determines the state, which varies based on program flow. This creates race conditions in the program logic.",
    fix: "Define non-overlapping line ranges for ACT/DEACT pairs. Document the purpose and range of each ACT/DEACT pair with comment lines. Use sequential, non-overlapping ranges (e.g., 2000-2100 for cooling, 3000-3100 for heating). Consider using ENABLE/DISABL as an alternative.",
    category: "Program Flow",
  },
  {
    id: 20,
    error: "GOTO Creating Unreachable Code",
    symptoms:
      "A section of the program never executes. Points controlled by the skipped code remain at initial or last-known values. Program completes without error but produces incorrect results.",
    rootCause:
      "An unconditional GOTO statement transfers execution past a block of code, making that block permanently unreachable. This is often introduced during program modifications or when conditional logic was accidentally removed.",
    fix: "Trace all GOTO statements to their target line numbers. Identify any code blocks with no execution path. Either remove dead code or restructure the GOTO logic. Use IF/THEN/ELSE conditional logic instead of GOTO where possible. Test with comment lines to verify execution paths.",
    category: "Program Flow",
  },

  // ── Configuration ─────────────────────────────────────────────────────────
  {
    id: 21,
    error: "SSTO Incorrect Start/Stop Times",
    symptoms:
      "Equipment starts too early or too late for occupancy. Building is not at comfort conditions when occupants arrive. Energy is wasted by starting equipment unnecessarily early.",
    rootCause:
      "SSTO (Start/Stop Time Optimization) coefficients do not match the building's actual thermal characteristics. The heating and cooling rate constants in SSTOCO are incorrect for the building mass, insulation, and HVAC capacity.",
    fix: "Recalculate SSTOCO coefficients based on actual building thermal performance. Monitor actual start-to-comfort times over several days and adjust coefficients. Verify the SSTO command has access to accurate outside air temperature and space temperature points. Ensure SSTO commands are evaluated through every program pass.",
    category: "Configuration",
  },
  {
    id: 22,
    error: "TOD Schedule Not Executing",
    symptoms:
      "Time-of-day scheduled events do not fire. Equipment stays in night mode during occupied hours or remains running during unoccupied periods.",
    rootCause:
      "The TOD command is inside a conditional block (IF/THEN) or deactivated line range, so it is not evaluated on every program pass. TOD, TODSET, and TODMOD commands must be evaluated through every pass for proper operation. Alternatively, the field panel clock may be incorrect.",
    fix: "Move TOD commands outside of all conditional blocks and deactivated ranges. Verify the field panel's real-time clock is accurate. Check DST settings. Confirm the time format matches PPCL expectations (decimal time for TOD/TODSET).",
    category: "Configuration",
  },
  {
    id: 23,
    error: "ADAPTM/ADAPTS Control Instability",
    symptoms:
      "Adaptive control output oscillates or saturates. Controlled process drifts from setpoint. Temperature swings exceed acceptable limits.",
    rootCause:
      "The adaptive control algorithm parameters (proportional band, integral time, derivative time, output limits) are not properly tuned for the specific mechanical system being controlled. System response characteristics may have changed since initial commissioning.",
    fix: "Review ADAPTM/ADAPTS parameters against the mechanical system characteristics. Start with conservative tuning values and gradually tighten. Verify sensor readings are accurate and representative of the controlled space. Check that the control output range matches the actuator range.",
    category: "Configuration",
  },
  {
    id: 24,
    error: "PDL Load Shedding Incorrect",
    symptoms:
      "Loads are shed in the wrong order. Critical equipment is shut down before non-critical loads. Peak demand still exceeds the setpoint despite load shedding.",
    rootCause:
      "PDL (Peak Demand Limiting) configuration is incorrect. PDLDAT load priority assignments do not match operational importance. PDLMTR meter monitoring parameters are misconfigured. PDLSET demand setpoint is too high or the deadband is too wide.",
    fix: "Review PDLDAT priority assignments to ensure critical loads have the highest priority (shed last). Verify PDLMTR meter calibration and pulse rate configuration. Adjust PDLSET demand target and deadband. Consider minimum on/off times for equipment protection.",
    category: "Configuration",
  },
  {
    id: 25,
    error: "Firmware Compatibility Issue",
    symptoms:
      "A PPCL command is rejected by the field panel. Program downloads successfully on one panel type but fails on another. Certain commands produce unexpected results.",
    rootCause:
      "Not all PPCL commands are available on all firmware types. The PPCL manual's compatibility bar shows which commands are supported on Unitary, pre-APOGEE, APOGEE, and BACnet firmware. Some commands require minimum firmware revision levels.",
    fix: "Check the compatibility bar in Chapter 3 of the PPCL User's Manual for each command used. Verify the field panel's firmware type and revision. Replace unsupported commands with equivalent logic using available commands. Consider firmware upgrades if critical commands are needed.",
    category: "Configuration",
  },
];
