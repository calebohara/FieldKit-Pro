/**
 * PPCL (Powers Process Control Language) Common Errors Reference
 * For use with Johnson Controls (JCI) building automation systems.
 *
 * This data file provides a structured reference for field engineers
 * diagnosing and resolving PPCL program errors in the field.
 *
 * Each entry describes a discrete error condition encountered during
 * PPCL program development, upload, download, or runtime execution
 * on JCI Metasys or legacy P2000/DX series controllers.
 *
 * Usage:
 *   import { ppclErrors, PPCLError } from '$lib/data/ppcl-errors';
 */

// ---------------------------------------------------------------------------
// Interface Definition
// ---------------------------------------------------------------------------
// id          - Unique numeric identifier for the error record
// error       - Short human-readable error name (matches controller output
//               where applicable)
// symptoms    - Observable behavior a field engineer would notice
// rootCause   - Technical explanation of why the error occurs
// fix         - Step-by-step remediation guidance
// category    - Logical grouping for filtering/display purposes
// ---------------------------------------------------------------------------

export interface PPCLError {
  id: number;
  error: string;
  symptoms: string;
  rootCause: string;
  fix: string;
  category: string;
}

// ---------------------------------------------------------------------------
// PPCL Error Data
// Categories: "Syntax" | "Runtime" | "Point Issues" |
//             "Program Flow" | "Configuration"
// ---------------------------------------------------------------------------

export const ppclErrors: PPCLError[] = [
  // ---- Syntax Errors -------------------------------------------------------
  {
    id: 1,
    error: "Missing ENDDO",
    symptoms:
      "Controller enters an infinite loop; the program scan time climbs until the watchdog timer fires and the controller resets or the program is marked faulted. Other programs on the same panel may stop executing.",
    rootCause:
      "A DO/WHILE or DO/UNTIL loop block was opened but the corresponding ENDDO statement was never written. PPCL requires every DO to be closed with ENDDO before the program can exit the loop during compilation or runtime scan.",
    fix: "Open the program in the PPCL editor. Search for every DO statement and verify a matching ENDDO exists at the correct indentation level. Add the missing ENDDO, re-compile, and re-download the program. Monitor scan time after download to confirm it returns to baseline.",
    category: "Syntax",
  },
  {
    id: 2,
    error: "Missing ENDIF",
    symptoms:
      "Compile-time error reported during program upload; editor highlights the line after the last IF block. Program will not download to the controller until the error is resolved.",
    rootCause:
      "An IF or IF/ELSE conditional block was opened but no ENDIF statement closes it. PPCL treats the remainder of the program as part of the open IF block, causing a structural mismatch at compile time.",
    fix: "Trace every IF statement in the program and confirm a corresponding ENDIF closes it. Nested IF blocks each require their own ENDIF. Add the missing ENDIF at the correct nesting level, re-compile, and re-download.",
    category: "Syntax",
  },
  {
    id: 3,
    error: "Variable Name Too Long",
    symptoms:
      "Compile error: 'Variable name exceeds maximum length'. The offending line is flagged in the editor. The program cannot be compiled or downloaded.",
    rootCause:
      "PPCL enforces a maximum variable name length (typically 8 characters for LOCAL variables and controller-specific limits for global references). A declared or referenced variable name exceeds this limit.",
    fix: "Identify all variable declarations and references that exceed the character limit. Rename them to shorter, still-descriptive identifiers (e.g., DISCHARGE_AIR_TEMP to DATMP). Update every reference to the renamed variable throughout the program, re-compile, and re-download.",
    category: "Syntax",
  },
  {
    id: 4,
    error: "Line Number Conflict",
    symptoms:
      "Compile error indicating a duplicate or out-of-sequence line number. The editor may refuse to accept the program or the controller rejects the download with a line number mismatch fault.",
    rootCause:
      "PPCL programs use explicit line numbers for GOTO and GOSUB targets. Duplicate line numbers or non-sequential numbering (depending on controller version) confuse the compiler's jump-table resolution, producing a conflict.",
    fix: "Use the editor's auto-renumber function if available, or manually audit all line numbers to ensure they are unique and sequential. Update all GOTO and GOSUB statements to reference the corrected line numbers. Re-compile and re-download.",
    category: "Syntax",
  },
  {
    id: 5,
    error: "GOSUB Without RETURN",
    symptoms:
      "Program execution falls through the end of a subroutine into subsequent code rather than returning to the calling line. Unexpected logic branches occur; outputs may be commanded incorrectly. In some controllers a stack overflow fault is logged.",
    rootCause:
      "A GOSUB statement transfers execution to a subroutine block, but the subroutine does not terminate with a RETURN statement. Without RETURN, the controller continues executing code sequentially past the subroutine end.",
    fix: "Locate every subroutine target (the label or line number referenced by GOSUB). Verify that each subroutine ends with a RETURN statement before the next logical block begins. Add missing RETURN statements, re-compile, and re-download. Add a comment header to each subroutine for clarity.",
    category: "Syntax",
  },

  // ---- Runtime Errors ------------------------------------------------------
  {
    id: 6,
    error: "Division by Zero",
    symptoms:
      "Controller logs a runtime fault on the specific line performing division. The calculated output point may go to zero, null, or an unreliable value. Downstream logic depending on that value behaves erratically.",
    rootCause:
      "A PPCL expression divides a value by a variable or point that evaluates to zero at runtime. This is often conditional on an operating mode (e.g., dividing by occupancy count when the zone is unoccupied).",
    fix: "Wrap the division in a guard condition: before dividing, check that the divisor is not zero (e.g., IF DIVISOR <> 0 THEN RESULT = NUMERATOR / DIVISOR ELSE RESULT = 0 ENDIF). Re-compile and re-download. Test with the divisor at zero to confirm the guard works.",
    category: "Runtime",
  },
  {
    id: 7,
    error: "WAIT Statement Blocking Execution",
    symptoms:
      "The program appears to stall; outputs controlled by code after the WAIT statement do not update for the duration of the wait period. If the wait is inside a loop, the entire panel scan may be delayed, triggering watchdog resets.",
    rootCause:
      "A WAIT statement suspends the current program's execution for a specified time. If used inside a tight loop or with an excessively long duration, it blocks the program from completing its scan within the controller's allowed cycle time.",
    fix: "Replace WAIT-based timing logic with time-stamp comparisons using the system clock (e.g., store a start time and compare against current time each scan). If WAIT is necessary, ensure the duration is shorter than the controller's maximum scan allowance. Move time-sensitive logic outside of loops.",
    category: "Runtime",
  },
  {
    id: 8,
    error: "Program Too Large for Memory",
    symptoms:
      "Download fails with a 'program memory exceeded' or 'insufficient memory' error. The controller refuses to accept the program. Previously downloaded programs on the panel continue to run.",
    rootCause:
      "The compiled PPCL program exceeds the available program memory on the controller. This can result from excessively long programs, too many variables, or attempting to load multiple large programs onto a memory-limited panel.",
    fix: "Split the program into multiple smaller programs and distribute logic across them, using global points to share data. Remove dead code, unused variables, and redundant comments (comments consume memory in some controllers). If the panel is near capacity, consider offloading logic to a supervisory controller or upgrading the panel.",
    category: "Runtime",
  },
  {
    id: 9,
    error: "ADAPT Range Error",
    symptoms:
      "The ADAPT (adaptive control) output saturates at its minimum or maximum limit and does not respond to the controlled variable. The controller may log an 'ADAPT out of range' message. The controlled process drifts from setpoint.",
    rootCause:
      "ADAPT parameters (gain, reset, or output limits) were configured outside the allowable range for the controller, or the adaptive algorithm accumulated integrator windup because the output was clamped for an extended period.",
    fix: "Review the ADAPT statement parameters against the controller's documentation for valid ranges. Reset integrator windup by temporarily setting the ADAPT output to manual and then returning to auto. Reconfigure gain and reset time based on the process characteristics. Consider adding anti-windup logic.",
    category: "Runtime",
  },
  {
    id: 10,
    error: "Communication Timeout",
    symptoms:
      "Points shared between panels (global or network points) show stale or last-known values. The dependent program logs a communication fault. Alarms may fire if the stale value triggers a threshold. The affected program may enter a fallback control mode.",
    rootCause:
      "The controller did not receive a refresh of a networked point value within the configured timeout period. This can result from a network wiring fault, a failed panel, excessive network traffic, or an incorrectly configured poll rate.",
    fix: "Check physical network wiring and termination resistors on the SA Bus or N2 trunk. Verify the source panel is online and the point is actively published. Reduce network poll frequency if the trunk is overloaded. Add timeout fallback logic in the PPCL program (e.g., IF COMM_FAULT = 1 THEN use local setpoint ENDIF).",
    category: "Runtime",
  },

  // ---- Point Issues --------------------------------------------------------
  {
    id: 11,
    error: "Point Not in Database",
    symptoms:
      "Runtime error: 'undefined point' or 'point not found' logged against the program line referencing the point. The program may halt or skip execution of the affected block. Any output depending on the missing point defaults to zero or null.",
    rootCause:
      "The program references a point name that does not exist in the controller's point database. Common causes include a typo in the point name, the point was deleted after the program was written, or the program was copied from another panel without updating point names.",
    fix: "Open the controller's point database and verify the exact spelling and case of the point name. Correct the reference in the PPCL program. If the point was intentionally removed, update the program logic to remove or replace the reference. Re-compile and re-download.",
    category: "Point Issues",
  },
  {
    id: 12,
    error: "Binary Point Override Stuck",
    symptoms:
      "A binary (digital) output or input point remains in a manually overridden state regardless of program commands. The point's status shows 'override' or 'manual' in the front-end. The controlled device does not respond to automatic control.",
    rootCause:
      "An operator or technician manually overrode the point at the controller or through the front-end and did not release the override. PPCL program writes to an overridden point are silently ignored; the override takes priority.",
    fix: "At the controller keypad or through the front-end software, navigate to the point and release the manual override (set to 'auto' or 'normal'). Confirm the program resumes control. Document the override event. Consider adding an alarm to notify operators when critical points remain in override longer than a defined period.",
    category: "Point Issues",
  },
  {
    id: 13,
    error: "Analog Point Out of Range",
    symptoms:
      "An analog input reads a value outside its configured engineering unit range (e.g., a temperature sensor reads -999 or 9999). Alarms fire incorrectly. Control loops using the point behave erratically or drive outputs to extremes.",
    rootCause:
      "The physical sensor signal (typically 0-10 VDC or 4-20 mA) is outside the expected range due to a wiring fault, a failed sensor, incorrect scaling configuration in the point database, or the point database range does not match the field device.",
    fix: "Measure the raw signal at the controller terminal with a multimeter. Compare against the expected signal range for the sensor type. If the signal is correct, reconfigure the point's low/high engineering unit range to match the sensor output curve. If the signal is out of spec, inspect wiring and replace the sensor as needed.",
    category: "Point Issues",
  },
  {
    id: 14,
    error: "Priority Conflict",
    symptoms:
      "A point's value is unexpectedly controlled by a source other than the PPCL program. The program's writes appear to be ignored or overridden. The front-end shows the point at an unexpected value with a priority indicator that does not match the program.",
    rootCause:
      "PPCL and Metasys use a priority array for point control. A higher-priority source (such as an operator override, an emergency command, or another program writing at a higher priority level) is commanding the point, preventing the PPCL program's write from taking effect.",
    fix: "Review the point's priority array in the front-end to identify which priority level is active. Release or clear the higher-priority command if it is not intentional. Determine if another program is unintentionally writing to the same point. Establish a priority convention across programs to prevent conflicts.",
    category: "Point Issues",
  },
  {
    id: 15,
    error: "Point Naming Convention Violation",
    symptoms:
      "Database import or point creation fails with a naming error. The point is rejected by the controller or the front-end. Existing programs that reference the intended point name fail to bind correctly.",
    rootCause:
      "JCI PPCL and Metasys enforce point naming rules: names must start with a letter, contain only alphanumeric characters and underscores, not exceed the character limit, and must not use reserved PPCL keywords. Violating any of these rules causes the point to be rejected.",
    fix: "Rename the point to comply with the naming convention: start with a letter, use only A-Z, 0-9, and underscore, keep the name within the controller's limit (typically 8-16 characters), and avoid PPCL reserved words (IF, DO, WHILE, etc.). Update all program references to the new name and re-download.",
    category: "Point Issues",
  },
  {
    id: 16,
    error: "DBSWIT Target Not Found",
    symptoms:
      "The DBSWIT (database switch) command executes but the target program or controller does not activate. A fault is logged indicating the switch target is invalid or unreachable. The expected failover behavior does not occur.",
    rootCause:
      "The DBSWIT command references a target program name or controller address that does not exist in the current database, has been renamed, or is on a panel that is offline or unreachable on the network at the time of execution.",
    fix: "Verify the exact target name and address specified in the DBSWIT statement against the current database. Confirm the target panel is online and communicating. Update the DBSWIT statement with the correct target name. If the target was removed, update the failover logic accordingly. Re-compile and re-download.",
    category: "Point Issues",
  },

  // ---- Program Flow --------------------------------------------------------
  {
    id: 17,
    error: "Resident vs Non-Resident Program Conflict",
    symptoms:
      "A program that was functioning correctly stops executing after a panel restart or power cycle. Logic that ran continuously now only executes on demand or not at all. Points controlled by the program revert to default or last-known values.",
    rootCause:
      "PPCL programs are designated as either Resident (run continuously on every controller scan) or Non-Resident (run only when explicitly called). If a program's residency flag is set incorrectly, it will not execute at the expected frequency, particularly after a power cycle that resets runtime state.",
    fix: "Review the program header and controller database to confirm the residency flag matches the intended behavior. Programs controlling active HVAC sequences should typically be Resident. Change the residency setting, re-download, and verify the program executes on every scan by monitoring output updates in real time.",
    category: "Program Flow",
  },
  {
    id: 18,
    error: "GOTO Causing Unreachable Code",
    symptoms:
      "A section of the program never executes. Points that should be commanded by the skipped code remain at their initial or last-known values. The program completes without error but produces incorrect results.",
    rootCause:
      "An unconditional GOTO statement transfers execution past a block of code, making that block permanently unreachable. This is often introduced when refactoring logic or when a conditional was accidentally removed.",
    fix: "Trace all GOTO statements to their target line numbers. Identify any code blocks that have no execution path leading into them. Either remove the dead code or fix the GOTO condition to make the code conditional. Re-compile and re-download. Use structured IF/ENDIF blocks in preference to GOTO where possible.",
    category: "Program Flow",
  },
  {
    id: 19,
    error: "LOCAL Variable Scope Error",
    symptoms:
      "A LOCAL variable retains a stale value from a previous scan or program invocation, causing incorrect calculations. Alternatively, a LOCAL variable initialized in one block is referenced outside its valid scope, producing a zero or null value unexpectedly.",
    rootCause:
      "LOCAL variables in PPCL are scoped to the program but not automatically re-initialized each scan unless explicitly set. If the program assumes a LOCAL variable starts at zero each scan without initializing it, accumulated values or leftover state from the prior scan can corrupt calculations.",
    fix: "Add explicit initialization of all LOCAL variables at the top of the program or at the beginning of each execution path that depends on a fresh value (e.g., LOCAL_SUM = 0 before a summation loop). Review variable lifetime expectations against the PPCL language specification for the target controller.",
    category: "Program Flow",
  },
  {
    id: 20,
    error: "Time Schedule Conflict",
    symptoms:
      "Equipment starts or stops at unexpected times, or two conflicting commands are issued within the same time window. Operators observe the equipment cycling between on and off rapidly, or occupancy mode does not match the intended schedule.",
    rootCause:
      "Multiple PPCL programs or Metasys schedules are writing to the same occupancy or command point with overlapping or conflicting time windows. Without a clear priority hierarchy, the last write wins, producing unpredictable behavior depending on program scan order.",
    fix: "Audit all programs and Metasys schedules that write to the affected point. Consolidate schedule logic into a single authoritative program or schedule object. Establish a clear priority hierarchy and remove redundant schedule writes. Document the intended schedule logic and verify with the building owner.",
    category: "Program Flow",
  },
  {
    id: 21,
    error: "Infinite Recursion via GOSUB",
    symptoms:
      "Controller watchdog trips shortly after the program starts executing. Scan time spikes to maximum before the reset. The program is marked as faulted. Other programs on the panel may be delayed or stopped.",
    rootCause:
      "A GOSUB statement calls a subroutine that, directly or indirectly, calls back into the originating subroutine before a RETURN is reached, creating an unbounded recursive call chain. PPCL controllers have a limited call stack and will fault when it overflows.",
    fix: "Map the call graph of all GOSUB statements. Identify any circular call chains. Restructure the logic to eliminate recursion, using flags or state variables to sequence through subroutine steps across multiple scans instead of recursive calls. Re-compile and re-download.",
    category: "Program Flow",
  },

  // ---- Configuration -------------------------------------------------------
  {
    id: 22,
    error: "ALARM Threshold Misconfigured",
    symptoms:
      "Alarms fire continuously or never fire when expected. The front-end shows alarm conditions that do not reflect actual field conditions. Operators lose trust in the alarm system and begin ignoring notifications.",
    rootCause:
      "The ALARM statement's high or low threshold values were entered in the wrong engineering units, set too close to normal operating values, or the deadband (hysteresis) was not configured, causing the alarm to chatter as the value oscillates around the threshold.",
    fix: "Review the ALARM statement parameters: confirm the threshold values are in the correct engineering units and are consistent with the point's configured range. Add or increase the deadband value to prevent chattering. Coordinate threshold values with the building owner or design engineer to reflect operational requirements.",
    category: "Configuration",
  },
  {
    id: 23,
    error: "Incorrect Controller Address",
    symptoms:
      "Download fails with a 'controller not found' or 'address conflict' error. Two panels on the same network trunk may exhibit erratic behavior as they respond to the same address. Communication faults are logged on the affected trunk.",
    rootCause:
      "Two or more controllers on the same N2 or SA Bus network trunk have been assigned the same device address, or the address configured in the controller hardware (DIP switches or firmware setting) does not match the address recorded in the front-end database.",
    fix: "Survey all controllers on the affected trunk and document their physical address settings. Resolve any duplicate addresses by changing the DIP switch or firmware address setting on the conflicting unit and updating the front-end database to match. Cycle power on the affected controllers and verify unique addressing before re-downloading programs.",
    category: "Configuration",
  },
  {
    id: 24,
    error: "Scan Rate Mismatch",
    symptoms:
      "Control loops respond sluggishly or oscillate. Time-sensitive sequences (e.g., economizer transitions) execute at the wrong frequency. Outputs that should update every 5 seconds may only update every 30 seconds or vice versa.",
    rootCause:
      "The program's configured execution interval (scan rate) does not match the time constants of the process being controlled. A scan rate that is too slow misses rapid process changes; a scan rate that is too fast wastes controller resources and can interfere with other programs.",
    fix: "Determine the appropriate scan rate based on the process time constant (e.g., airside loops typically 5-15 seconds, hydronic loops 30-60 seconds). Update the program's execution interval in the controller database. Re-download and monitor control stability. Adjust PID tuning parameters if the scan rate change affects loop stability.",
    category: "Configuration",
  },
  {
    id: 25,
    error: "Sensor Calibration Offset Not Applied",
    symptoms:
      "Measured values are consistently offset from reference measurements (e.g., a space temperature sensor reads 3 degrees F high compared to a calibrated thermometer). Control setpoints appear correct but the space is not maintained at the intended condition.",
    rootCause:
      "The sensor or point configuration does not include a calibration offset to correct for sensor drift, installation effects, or manufacturing tolerance. PPCL uses the raw scaled value without compensation, resulting in systematic error in all calculations using that point.",
    fix: "Measure the actual value with a calibrated reference instrument. Calculate the offset (reference minus sensor reading). Apply the offset either in the point database calibration field (preferred) or in the PPCL program by adding the offset constant to the raw point value before use. Document the calibration date and offset value.",
    category: "Configuration",
  },
  {
    id: 26,
    error: "Missing Network Point Publication",
    symptoms:
      "A point value shared from one controller to another reads zero, null, or the last known good value on the receiving panel. Programs on the receiving panel that depend on the shared point compute incorrect results. No explicit error is logged; the failure is silent.",
    rootCause:
      "The source controller is not configured to publish (broadcast) the point value onto the network at the required poll rate. This occurs when a point is added to the source panel's database but the publication or binding configuration is not completed in the front-end.",
    fix: "Open the source panel's network configuration in the front-end. Locate the point and enable publication or verify the binding between source and destination. Set an appropriate publication rate. Force a manual refresh and confirm the receiving panel updates. Add monitoring logic in the receiving program to detect stale values.",
    category: "Configuration",
  },
  {
    id: 27,
    error: "Daylight Saving Time Transition Fault",
    symptoms:
      "At DST transitions, time-based schedules execute at the wrong time for up to one hour. Scheduled start/stop commands for HVAC equipment occur one hour early or late. Alarms tied to time windows fire incorrectly on transition days.",
    rootCause:
      "The controller's real-time clock is not configured to automatically adjust for Daylight Saving Time, or the DST offset rules stored in the controller do not match the local jurisdiction's current DST schedule. Some older controllers require manual clock adjustment.",
    fix: "Verify the controller's DST configuration in the system setup menu. Confirm the DST start and end dates and the offset value match the current jurisdiction rules. Enable automatic DST adjustment if supported. For controllers without automatic adjustment, add a maintenance task to manually update the clock at each DST transition. Verify schedule accuracy after each transition.",
    category: "Configuration",
  },
];
