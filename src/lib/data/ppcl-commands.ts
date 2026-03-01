/**
 * PPCL Command Reference Data
 *
 * Powers Process Control Language (PPCL) is the programming language used
 * in Johnson Controls Inc. (JCI) Metasys and legacy building automation
 * systems. This file provides a structured reference for all major PPCL
 * commands used in field engineering and commissioning work.
 *
 * Each entry follows the PPCLCommand interface, providing:
 *   - command:     The PPCL keyword or operator exactly as written in code
 *   - syntax:      Formal syntax with placeholder arguments in angle brackets
 *   - description: Plain-English explanation of what the command does
 *   - example:     A realistic code snippet showing typical usage in a program
 *   - category:    Logical grouping for UI filtering and documentation
 *
 * Categories map to the six functional areas of PPCL programming:
 *   "Program Flow"    - Control structures, branching, subroutines
 *   "Math/Logic"      - Arithmetic operators and comparison operators
 *   "Point Operations"- Reading and writing point values and states
 *   "Time/Schedule"   - TOD scheduling, holiday, and run-mode commands
 *   "Communication"   - Inter-panel communication and data exchange
 *   "System"          - Variable declarations, alarms, and system directives
 */

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * Represents a single PPCL command with its full reference documentation.
 */
export interface PPCLCommand {
  /** The PPCL keyword or operator as it appears in source code (e.g. "IF", "SET", "+") */
  command: string;

  /** Formal syntax string using angle-bracket placeholders for arguments */
  syntax: string;

  /** Human-readable description of the command's purpose and behavior */
  description: string;

  /** A realistic code snippet demonstrating a common use of the command */
  example: string;

  /** Functional category used for grouping and filtering in the UI */
  category:
    | "Program Flow"
    | "Math/Logic"
    | "Point Operations"
    | "Time/Schedule"
    | "Communication"
    | "System";
}

// ─── Command Definitions ──────────────────────────────────────────────────────

export const ppclCommands: PPCLCommand[] = [
  // ── Program Flow ────────────────────────────────────────────────────────────

  {
    command: "IF",
    syntax: "IF <condition> THEN",
    description:
      "Begins a conditional block. The statements between IF/THEN and ENDIF (or ELSE) " +
      "execute only when the condition evaluates to true. Conditions use comparison " +
      "operators (EQ, NE, GT, LT, GE, LE) and can be chained with AND/OR.",
    example:
      "IF ZN-TEMP GT 72.0 THEN\n" +
      "  SET CLG-VLV = 100.0\n" +
      "ENDIF",
    category: "Program Flow",
  },
  {
    command: "THEN",
    syntax: "IF <condition> THEN",
    description:
      "Required keyword that terminates the condition clause of an IF statement. " +
      "All statements following THEN (until ELSE or ENDIF) execute when the IF " +
      "condition is true.",
    example:
      "IF OA-TEMP LT 55.0 THEN\n" +
      "  SET HTG-VLV = 75.0\n" +
      "ENDIF",
    category: "Program Flow",
  },
  {
    command: "ELSE",
    syntax: "ELSE",
    description:
      "Optional clause within an IF/ENDIF block. Statements following ELSE execute " +
      "when the IF condition is false. Only one ELSE clause is permitted per IF block.",
    example:
      "IF OCC-MODE EQ 1 THEN\n" +
      "  SET SETPT = 70.0\n" +
      "ELSE\n" +
      "  SET SETPT = 60.0\n" +
      "ENDIF",
    category: "Program Flow",
  },
  {
    command: "ENDIF",
    syntax: "ENDIF",
    description:
      "Closes an IF/THEN or IF/THEN/ELSE conditional block. Every IF statement " +
      "must have a corresponding ENDIF. Nesting is supported up to the controller's " +
      "maximum nesting depth.",
    example:
      "IF FAN-STATUS EQ ON THEN\n" +
      "  SET VFD-SPD = 50.0\n" +
      "ENDIF",
    category: "Program Flow",
  },
  {
    command: "DO",
    syntax: "DO <count>",
    description:
      "Begins a counted loop block that repeats the enclosed statements a fixed " +
      "number of times. The count may be a literal integer or a numeric point " +
      "reference. Loops must be closed with ENDDO.",
    example:
      "DO 5\n" +
      "  SET PULSE-OUT = ON\n" +
      "  WAIT 0:00:02\n" +
      "  SET PULSE-OUT = OFF\n" +
      "  WAIT 0:00:02\n" +
      "ENDDO",
    category: "Program Flow",
  },
  {
    command: "ENDDO",
    syntax: "ENDDO",
    description:
      "Closes a DO loop block and returns execution to the DO statement for the " +
      "next iteration. When the iteration count is exhausted, execution continues " +
      "with the statement immediately after ENDDO.",
    example:
      "DO 3\n" +
      "  SET ALARM-OUT = ON\n" +
      "  WAIT 0:00:01\n" +
      "  SET ALARM-OUT = OFF\n" +
      "ENDDO",
    category: "Program Flow",
  },
  {
    command: "GOTO",
    syntax: "GOTO <label>",
    description:
      "Unconditionally transfers program execution to the specified label within " +
      "the same program. Labels are defined by placing a colon-suffixed identifier " +
      "on its own line. Avoid using GOTO in place of structured loop constructs.",
    example:
      "IF FAULT-BIT EQ 1 THEN\n" +
      "  GOTO FAULT_HANDLER\n" +
      "ENDIF\n" +
      "...\n" +
      "FAULT_HANDLER:",
    category: "Program Flow",
  },
  {
    command: "GOSUB",
    syntax: "GOSUB <label>",
    description:
      "Calls a subroutine at the specified label, saving the return address on the " +
      "call stack. Execution continues at the label and returns to the statement " +
      "after GOSUB when a RETURN statement is encountered.",
    example:
      "GOSUB CALC_DEWPOINT\n" +
      "IF DEWPT GT 65.0 THEN\n" +
      "  SET DEHUM-CMD = ON\n" +
      "ENDIF",
    category: "Program Flow",
  },
  {
    command: "RETURN",
    syntax: "RETURN",
    description:
      "Returns execution from a subroutine to the statement following the most " +
      "recent GOSUB call. Must be placed at the end of every subroutine block. " +
      "Calling RETURN outside a subroutine terminates the program execution cycle.",
    example:
      "CALC_DEWPOINT:\n" +
      "  LOCAL DEWPT\n" +
      "  SET DEWPT = RH-SENSOR * 0.36 + OA-TEMP - 10.0\n" +
      "RETURN",
    category: "Program Flow",
  },

  // ── Point Operations ─────────────────────────────────────────────────────────

  {
    command: "SET",
    syntax: "SET <point> = <value>",
    description:
      "Writes a value to a point. For analog points the value is a floating-point " +
      "number; for binary points use ON/OFF or 1/0. SET can also write to local " +
      "variables. The point must be defined and in the correct mode to accept writes.",
    example: "SET CHW-VLV = 75.5",
    category: "Point Operations",
  },
  {
    command: "ENABLE",
    syntax: "ENABLE <point>",
    description:
      "Places a binary or program point into the ENABLED state, allowing it to " +
      "respond to normal control logic. Commonly used after a DISABLE command to " +
      "restore normal operation of a point or program.",
    example:
      "IF MAINT-MODE EQ OFF THEN\n" +
      "  ENABLE AHU-1-PGM\n" +
      "ENDIF",
    category: "Point Operations",
  },
  {
    command: "DISABLE",
    syntax: "DISABLE <point>",
    description:
      "Places a binary or program point into the DISABLED state, preventing it from " +
      "being changed by control logic. Used for maintenance lockouts or to inhibit " +
      "a program from executing its control actions.",
    example:
      "IF FIRE-ALARM EQ ON THEN\n" +
      "  DISABLE VENT-PGM\n" +
      "ENDIF",
    category: "Point Operations",
  },
  {
    command: "ON",
    syntax: "SET <point> = ON",
    description:
      "Binary state constant representing the active/energized state of a binary " +
      "point. Equivalent to the numeric value 1. Used as the right-hand side of a " +
      "SET command or in condition comparisons.",
    example: "SET EXHAUST-FAN = ON",
    category: "Point Operations",
  },
  {
    command: "OFF",
    syntax: "SET <point> = OFF",
    description:
      "Binary state constant representing the inactive/de-energized state of a " +
      "binary point. Equivalent to the numeric value 0. Used as the right-hand " +
      "side of a SET command or in condition comparisons.",
    example: "SET EXHAUST-FAN = OFF",
    category: "Point Operations",
  },
  {
    command: "AUTO",
    syntax: "AUTO <point>",
    description:
      "Returns a point to automatic (program-controlled) mode after it has been " +
      "manually overridden. In AUTO mode the point accepts writes from PPCL " +
      "programs according to normal control logic priorities.",
    example:
      "IF OVERRIDE-TIMER EQ 0 THEN\n" +
      "  AUTO CHW-VLV\n" +
      "ENDIF",
    category: "Point Operations",
  },
  {
    command: "START",
    syntax: "START <point>",
    description:
      "Issues a start command to a binary output point, typically a motor or fan. " +
      "Equivalent to SET <point> = ON but semantically clearer for equipment " +
      "control. Triggers associated start interlock logic if defined.",
    example:
      "IF ZN-TEMP GT COOLING-SETPT THEN\n" +
      "  START AHU-1-FAN\n" +
      "ENDIF",
    category: "Point Operations",
  },
  {
    command: "STOP",
    syntax: "STOP <point>",
    description:
      "Issues a stop command to a binary output point. Equivalent to SET <point> = OFF " +
      "but semantically clearer for equipment control. May trigger associated " +
      "safe-state sequencing logic if configured on the point.",
    example:
      "IF OCC-MODE EQ UNOCCUPIED THEN\n" +
      "  STOP AHU-1-FAN\n" +
      "ENDIF",
    category: "Point Operations",
  },

  // ── Math / Logic ─────────────────────────────────────────────────────────────

  {
    command: "+",
    syntax: "<operand1> + <operand2>",
    description:
      "Addition operator. Adds two numeric values or point references together. " +
      "Used in SET expressions and condition clauses. Operands may be numeric " +
      "literals, point identifiers, or local variables.",
    example: "SET SUPPLY-SETPT = ZN-SETPT + OFFSET",
    category: "Math/Logic",
  },
  {
    command: "-",
    syntax: "<operand1> - <operand2>",
    description:
      "Subtraction operator. Subtracts the second operand from the first. Used in " +
      "SET expressions to compute deltas and offsets between point values.",
    example: "SET TEMP-DELTA = SUPPLY-TEMP - RETURN-TEMP",
    category: "Math/Logic",
  },
  {
    command: "*",
    syntax: "<operand1> * <operand2>",
    description:
      "Multiplication operator. Multiplies two numeric values. Commonly used for " +
      "proportional gain calculations, unit conversions, and scaling sensor inputs.",
    example: "SET KW-CALC = AMPS * VOLTS * 0.001",
    category: "Math/Logic",
  },
  {
    command: "/",
    syntax: "<operand1> / <operand2>",
    description:
      "Division operator. Divides the first operand by the second. Ensure the " +
      "divisor is never zero; PPCL does not throw a runtime exception on divide-by-zero " +
      "but results are undefined. Guard with an IF check when necessary.",
    example:
      "IF TOTAL-FLOW GT 0.0 THEN\n" +
      "  SET AVG-FLOW = TOTAL-FLOW / NUM-ZONES\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "EQ",
    syntax: "<operand1> EQ <operand2>",
    description:
      "Equal-to comparison operator. Returns true when both operands have the same " +
      "value. Works for both analog (floating-point equality) and binary (state) " +
      "comparisons. Use with caution for floating-point analog points.",
    example:
      "IF FAN-STATUS EQ ON THEN\n" +
      "  SET STATUS-LED = ON\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "NE",
    syntax: "<operand1> NE <operand2>",
    description:
      "Not-equal-to comparison operator. Returns true when the two operands have " +
      "different values. Useful for detecting state changes and fault conditions " +
      "where a point differs from its expected value.",
    example:
      "IF FAN-CMD NE FAN-STATUS THEN\n" +
      "  SET FAN-FAULT = ON\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "GT",
    syntax: "<operand1> GT <operand2>",
    description:
      "Greater-than comparison operator. Returns true when the first operand is " +
      "strictly greater than the second. Used for high-limit checking and " +
      "threshold-based control logic.",
    example:
      "IF DUCT-PRESS GT 2.5 THEN\n" +
      "  SET VFD-SPEED = VFD-SPEED - 5.0\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "LT",
    syntax: "<operand1> LT <operand2>",
    description:
      "Less-than comparison operator. Returns true when the first operand is " +
      "strictly less than the second. Used for low-limit checking and minimum " +
      "threshold control logic.",
    example:
      "IF SUPPLY-TEMP LT 45.0 THEN\n" +
      "  ALARM FREEZE-STAT 'FREEZESTAT TRIPPED'\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "GE",
    syntax: "<operand1> GE <operand2>",
    description:
      "Greater-than-or-equal-to comparison operator. Returns true when the first " +
      "operand is greater than or equal to the second. Useful for setpoint " +
      "comparisons where equality should trigger the same action.",
    example:
      "IF ZN-TEMP GE COOLING-SETPT THEN\n" +
      "  START COOLING-STAGE-1\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "LE",
    syntax: "<operand1> LE <operand2>",
    description:
      "Less-than-or-equal-to comparison operator. Returns true when the first " +
      "operand is less than or equal to the second. Useful for minimum-setpoint " +
      "checking where equality should satisfy the condition.",
    example:
      "IF ZN-TEMP LE HEATING-SETPT THEN\n" +
      "  START HTG-STAGE-1\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "AND",
    syntax: "<condition1> AND <condition2>",
    description:
      "Logical AND operator. Combines two conditions so the compound expression is " +
      "true only when both conditions are true simultaneously. Multiple AND " +
      "operators may be chained in a single IF condition.",
    example:
      "IF FAN-STATUS EQ ON AND FILTER-DP GT 1.0 THEN\n" +
      "  SET FILTER-ALARM = ON\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "OR",
    syntax: "<condition1> OR <condition2>",
    description:
      "Logical OR operator. Combines two conditions so the compound expression is " +
      "true when at least one condition is true. Used for fault aggregation and " +
      "alternative trigger conditions.",
    example:
      "IF SMOKE-DET-1 EQ ON OR SMOKE-DET-2 EQ ON THEN\n" +
      "  EMERG FIRE-SEQUENCE\n" +
      "ENDIF",
    category: "Math/Logic",
  },
  {
    command: "NOT",
    syntax: "NOT <condition>",
    description:
      "Logical NOT operator. Inverts a boolean condition, returning true when the " +
      "condition is false and false when the condition is true. Used to negate " +
      "binary point states or comparison results.",
    example:
      "IF NOT FAN-STATUS EQ ON THEN\n" +
      "  SET FAN-FAIL-ALARM = ON\n" +
      "ENDIF",
    category: "Math/Logic",
  },

  // ── Time / Schedule ──────────────────────────────────────────────────────────

  {
    command: "TODMOD",
    syntax: "TODMOD <point> <schedule-block>",
    description:
      "Time-Of-Day MODification command. Sets the time-of-day schedule entry for " +
      "a point or program. The schedule block defines start time, stop time, and " +
      "day-of-week bits. Used to automate occupancy and setpoint scheduling.",
    example: "TODMOD AHU-1-PGM 1 07:00 18:00 MTWTF",
    category: "Time/Schedule",
  },
  {
    command: "HOLMOD",
    syntax: "HOLMOD <point> <holiday-index> <date>",
    description:
      "HOLiday MODification command. Assigns a holiday exception date to a point " +
      "or program so it follows the holiday schedule instead of the standard TOD " +
      "schedule on the specified date.",
    example: "HOLMOD AHU-1-PGM 1 12/25",
    category: "Time/Schedule",
  },
  {
    command: "RUNMOD",
    syntax: "RUNMOD <program> <mode>",
    description:
      "RUN MODe command. Sets the execution mode of a PPCL program. Modes include " +
      "RUN (normal execution), HOLD (execution suspended), and RESTART (reset and " +
      "resume). Used to control program lifecycle from another program.",
    example:
      "IF MAINT-SW EQ ON THEN\n" +
      "  RUNMOD AHU-1-PGM HOLD\n" +
      "ELSE\n" +
      "  RUNMOD AHU-1-PGM RUN\n" +
      "ENDIF",
    category: "Time/Schedule",
  },

  // ── Communication ────────────────────────────────────────────────────────────

  {
    command: "DBSWIT",
    syntax: "DBSWIT <point> <panel-id>",
    description:
      "DataBase SWITch command. Routes a point reference to a specific peer panel " +
      "in a multi-panel network. Enables one panel's PPCL program to read or write " +
      "points that reside on another panel in the same network segment.",
    example: "DBSWIT CHILLER-STATUS 2",
    category: "Communication",
  },
  {
    command: "LOOP",
    syntax: "LOOP <interval>",
    description:
      "Sets the recurring execution interval for the current program in " +
      "hours:minutes:seconds format. The program will re-execute automatically " +
      "at each interval. A LOOP at the end of the program body is the standard " +
      "way to create a continuously running control loop.",
    example:
      "* Main control logic above\n" +
      "SET OUT-TEMP = OA-TEMP-SENSOR\n" +
      "LOOP 0:00:30",
    category: "Communication",
  },
  {
    command: "TABLE",
    syntax: "TABLE <name> <index> <value-list>",
    description:
      "Defines a lookup table that maps an index value to a corresponding output " +
      "value. Used for linearization of non-linear sensors, staged output sequencing, " +
      "and schedule lookup without complex IF/ELSE chains.",
    example:
      "TABLE STAGE-TBL COOLING-STAGES 0 1 2 3\n" +
      "SET ACTIVE-STAGES = TABLE(STAGE-TBL, DEMAND-LEVEL)",
    category: "Communication",
  },
  {
    command: "SIDSID",
    syntax: "SIDSID <source-panel> <dest-panel>",
    description:
      "Sets the System ID to System ID routing for inter-panel communication. " +
      "Defines the source and destination panel IDs used when sharing point data " +
      "across the N2 or BACnet network trunk.",
    example: "SIDSID 1 3",
    category: "Communication",
  },
  {
    command: "WAIT",
    syntax: "WAIT <hh:mm:ss>",
    description:
      "Suspends execution of the current program for the specified duration in " +
      "hours:minutes:seconds format. After the wait period, execution continues " +
      "with the next statement. Commonly used for time delays in sequencing logic.",
    example:
      "START AHU-1-FAN\n" +
      "WAIT 0:00:30\n" +
      "IF FAN-STATUS EQ OFF THEN\n" +
      "  SET FAN-FAIL = ON\n" +
      "ENDIF",
    category: "Communication",
  },
  {
    command: "SAMPLE",
    syntax: "SAMPLE <point> <interval>",
    description:
      "Instructs the controller to sample the specified point at the given interval " +
      "and store the value for trend logging or averaging calculations. The sampled " +
      "values are accessible through the Metasys trend data interface.",
    example: "SAMPLE ZN-TEMP 0:05:00",
    category: "Communication",
  },

  // ── System ───────────────────────────────────────────────────────────────────

  {
    command: "DEFINE",
    syntax: "DEFINE <point-id> <point-type> [<attributes>]",
    description:
      "Declares and registers a point within the controller's database. Specifies " +
      "the point identifier, type (AI, AO, BI, BO, or program), and optional " +
      "attributes such as engineering units, limits, and alarm parameters. DEFINE " +
      "statements appear at the top of the program or in a separate definition block.",
    example: "DEFINE ZN-TEMP AI UNITS=DEGF HIALM=85.0 LOALM=55.0",
    category: "System",
  },
  {
    command: "LOCAL",
    syntax: "LOCAL <variable-name> [= <initial-value>]",
    description:
      "Declares a local numeric variable scoped to the current program execution " +
      "cycle. Local variables are not visible to other programs and reset to their " +
      "initial value (or zero if unspecified) on each program restart.",
    example:
      "LOCAL TEMP-DIFF = 0.0\n" +
      "SET TEMP-DIFF = SUPPLY-TEMP - RETURN-TEMP",
    category: "System",
  },
  {
    command: "ADAPT",
    syntax: "ADAPT <point> <parameter> <value>",
    description:
      "Modifies an adaptive control parameter for a point at runtime. Used to " +
      "tune PID gains, reset rates, and authority values without reloading the " +
      "program. Changes made with ADAPT persist until the controller is restarted " +
      "or another ADAPT command overrides them.",
    example: "ADAPT CHW-VLV PGAIN 2.5",
    category: "System",
  },
  {
    command: "ALARM",
    syntax: "ALARM <point> '<message>'",
    description:
      "Generates a controller-level alarm for the specified point with the given " +
      "text message. The alarm is transmitted to the Metasys network for annunciation " +
      "and logging. Message text must be enclosed in single quotes and is limited " +
      "to 40 characters.",
    example:
      "IF DUCT-TEMP GT 120.0 THEN\n" +
      "  ALARM DUCT-TEMP 'HIGH DUCT TEMP LIMIT EXCEEDED'\n" +
      "ENDIF",
    category: "System",
  },
  {
    command: "EMERG",
    syntax: "EMERG <program-label>",
    description:
      "Triggers an emergency program or subroutine, immediately transferring " +
      "execution to the specified label or program with the highest execution " +
      "priority. Used for life-safety sequences such as smoke control, fire " +
      "shutdown, and freeze protection that must preempt normal control logic.",
    example:
      "IF FREEZE-STAT EQ OPEN THEN\n" +
      "  EMERG FREEZE-PROTECT\n" +
      "ENDIF",
    category: "System",
  },
];
