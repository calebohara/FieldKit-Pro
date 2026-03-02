/**
 * PPCL Command Reference Data
 *
 * Powers Process Control Language (PPCL) is the programming language used
 * in Siemens APOGEE building automation systems. This file provides a
 * structured reference for all PPCL commands from the official manual.
 *
 * Source: APOGEE PPCL User's Manual (125-1896, Rev. 6, May 2006)
 * - Chapter 1: Programming Methodology (operators, functions, resident points)
 * - Chapter 3: Command Syntax (all commands)
 * - Appendix A: PPCL Reserved Word List
 *
 * Categories map to the functional areas of PPCL programming:
 *   "Program Flow"     - IF/THEN/ELSE, GOTO, GOSUB, RETURN, ACT/DEACT, ENABLE/DISABL
 *   "Point Control"    - ON, OFF, SET, AUTO, FAST, SLOW, ALARM, RELEAS
 *   "Operators"        - Relational (.EQ., .GT., etc.), logical (.AND., .OR., etc.)
 *   "Math/Functions"   - Arithmetic functions (ATN, COS, SQRT, etc.), special functions
 *   "Time/Schedule"    - TOD, TODMOD, TODSET, LOOP, WAIT, SAMPLE, SSTO, DAY, NIGHT, HOLIDA
 *   "System"           - DEFINE, LOCAL, ONPWRT, STATE, PDL commands, DC commands, ADAPTM/S
 *   "Communication"    - DBSWIT, OIP, DISALM, ENALM, DISCOV, ENCOV, DPHONE, EPHONE
 */

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PPCLCommand {
  /** The PPCL keyword or operator as it appears in source code */
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
    | "Point Control"
    | "Operators"
    | "Math/Functions"
    | "Time/Schedule"
    | "System"
    | "Communication";
}

// ─── Command Definitions (Chapter 3 — Command Syntax) ────────────────────────

export const ppclCommands: PPCLCommand[] = [
  // ── Program Flow ──────────────────────────────────────────────────────────

  {
    command: "IF/THEN/ELSE",
    syntax: "IF (<condition>) THEN <action> ELSE <action>",
    description:
      "Conditional control statement. Evaluates a condition and executes the THEN action if true, " +
      "or the optional ELSE action if false. PPCL uses single-line conditionals — there is no ENDIF. " +
      "Conditions use dotted relational operators (.EQ., .GT., .LT., .GE., .LE., .NE.) and " +
      "logical operators (.AND., .OR., .NAND., .XOR.). A single statement can incorporate up to " +
      "16 combined relational and logical operators.",
    example: "1010 IF (OATEMP.GT.85.0) THEN ON(SFAN1) ELSE OFF(SFAN1)",
    category: "Program Flow",
  },
  {
    command: "GOTO",
    syntax: "GOTO line#",
    description:
      "Unconditionally transfers program execution to the specified line number. " +
      "Design guidelines recommend GOTO should always transfer to a sequentially higher " +
      "line number to prevent endless loops. If the target line does not exist, execution " +
      "transfers to the next line after the specified number.",
    example: "10 IF (FANRUN.GE.1000) THEN GOTO 50",
    category: "Program Flow",
  },
  {
    command: "GOSUB",
    syntax: "GOSUB line# pt1,...,pt15",
    description:
      "Transfers execution to a subroutine beginning at the specified line number, saving the " +
      "return address. When a RETURN statement is encountered, execution resumes at the statement " +
      "after the GOSUB. Parentheses around arguments are optional. Up to 15 point names or local " +
      "variables can be passed to the subroutine. Each subroutine must end with RETURN.",
    example: "1060 GOSUB 3000 SPACE1, CLGSET",
    category: "Program Flow",
  },
  {
    command: "RETURN",
    syntax: "RETURN",
    description:
      "Returns execution from a subroutine to the statement following the most recent GOSUB call. " +
      "Every subroutine must end with a RETURN statement. Calling RETURN outside a subroutine " +
      "causes the program to restart from its first line.",
    example: "3020 RETURN",
    category: "Program Flow",
  },
  {
    command: "ACT",
    syntax: "ACT(line1,...,line16)",
    description:
      "Activates (enables execution of) specified program lines. Up to 16 individual line numbers " +
      "can be listed. A range of lines cannot be defined — each line must be specified individually. " +
      "Lines deactivated with DEACT will begin executing again. ACT and ENABLE are interchangeable.",
    example: "100 IF (TIME.GT.8:00.AND.TIME.LT.17:00) THEN ACT(120) ELSE DEACT(120)",
    category: "Program Flow",
  },
  {
    command: "DEACT",
    syntax: "DEACT(line1,...,line16)",
    description:
      "Deactivates (disables execution of) specified program lines. Up to 16 individual line numbers " +
      "can be listed. A range of lines cannot be defined — each line must be specified individually. " +
      "Deactivated lines are skipped until reactivated with ACT.",
    example: "1050 IF (SFAN1.EQ.OFF) THEN DEACT(2000, 2010, 2020)",
    category: "Program Flow",
  },
  {
    command: "ENABLE",
    syntax: "ENABLE(line1,...,line16)",
    description:
      "Enables specified program lines for execution. Up to 16 individual line numbers can be listed. " +
      "A range of lines cannot be defined — each line must be specified individually. " +
      "ENABLE and ACT can be used interchangeably.",
    example: "1040 IF (MODE.EQ.ON) THEN ENABLE(2000, 2010, 2020)",
    category: "Program Flow",
  },
  {
    command: "DISABL",
    syntax: "DISABL(line1,...,line16)",
    description:
      "Disables specified program lines from executing. Up to 16 individual line numbers can be listed. " +
      "A range of lines cannot be defined — each line must be specified individually. " +
      "Disabled lines are skipped until re-enabled with ENABLE.",
    example: "1050 IF (MODE.EQ.OFF) THEN DISABL(2000, 2010, 2020)",
    category: "Program Flow",
  },

  // ── Point Control ─────────────────────────────────────────────────────────

  {
    command: "ON",
    syntax: "ON(<pt1>, ..., <pt16>)",
    description:
      "Commands one or more points to the ON state. Up to 16 points can be turned on by a single " +
      "command. Used for binary output points such as fans, pumps, and valves.",
    example: "1010 IF (OATEMP.GT.85.0) THEN ON(SFAN1)",
    category: "Point Control",
  },
  {
    command: "OFF",
    syntax: "OFF(<pt1>, ..., <pt16>)",
    description:
      "Commands one or more points to the OFF state. Up to 16 points can be turned off by a single " +
      "command. Used for binary output points such as fans, pumps, and valves.",
    example: "1020 IF (OATEMP.LT.65.0) THEN OFF(SFAN1)",
    category: "Point Control",
  },
  {
    command: "SET",
    syntax: "SET(value,pt1,...,pt15)",
    description:
      "Sets one or more points to a specified value. The value comes first, followed by up to " +
      "15 point names. Value must be a decimal, logical point, or local variable (not an integer). " +
      "An optional @prior parameter can set point priority. Note: direct assignment (point = value) " +
      "is also valid PPCL syntax for single-point operations.",
    example: "1030 SET(74.0, CLGSET)",
    category: "Point Control",
  },
  {
    command: "AUTO",
    syntax: "AUTO(<pt1>, ..., <pt16>)",
    description:
      "Returns one or more points to the automatic (program-controlled) state. " +
      "Up to 16 points can be restored to auto by a single command. Removes manual overrides.",
    example: "1040 AUTO(SFAN1, CHW1)",
    category: "Point Control",
  },
  {
    command: "FAST",
    syntax: "FAST(<pt1>, ..., <pt16>)",
    description:
      "Commands one or more points to the FAST state. Typically used for multi-speed equipment " +
      "such as fan motors. Up to 16 points per command.",
    example: "1050 IF (OATEMP.GT.90.0) THEN FAST(SFAN1)",
    category: "Point Control",
  },
  {
    command: "SLOW",
    syntax: "SLOW(<pt1>, ..., <pt16>)",
    description:
      "Commands one or more points to the SLOW state. Typically used for multi-speed equipment " +
      "such as fan motors. Up to 16 points per command.",
    example: "1060 IF (OATEMP.LT.75.0) THEN SLOW(SFAN1)",
    category: "Point Control",
  },
  {
    command: "ALARM",
    syntax: "ALARM(<pt1>, ..., <pt16>)",
    description:
      "Places one or more points into the ALARM state. Used to generate alarm conditions " +
      "for operator notification. Up to 16 points can be alarmed by a single command.",
    example: "1070 IF (SFAN1.EQ.ON.AND.PRFON.NE.ON) THEN ALARM(SFAN1)",
    category: "Point Control",
  },
  {
    command: "NORMAL",
    syntax: "NORMAL(<pt1>, ..., <pt16>)",
    description:
      "Returns one or more points to the NORMAL operating mode. Clears alarm conditions " +
      "and restores standard operation. Up to 16 points per command.",
    example: "1080 IF (SFAN1.EQ.ON.AND.PRFON.EQ.ON) THEN NORMAL(SFAN1)",
    category: "Point Control",
  },
  {
    command: "RELEAS",
    syntax: "RELEAS(<pt1>, ..., <pt16>)",
    description:
      "Releases PPCL program control of one or more points, allowing other control sources " +
      "(such as operator commands or other programs) to take precedence. Up to 16 points per command.",
    example: "1090 IF (MAINT.EQ.ON) THEN RELEAS(SFAN1)",
    category: "Point Control",
  },
  {
    command: "HLIMIT",
    syntax: "HLIMIT(value,pt1,...,pt15)",
    description:
      "Sets the high alarm limit for one or more points. The value comes first, followed by up to " +
      "15 point names. Value must be a decimal, point name, or local variable (not an integer). " +
      "When a point's value exceeds this limit, an alarm condition is generated.",
    example: "1100 HLIMIT(100.0, OATEMP, SPACE1)",
    category: "Point Control",
  },
  {
    command: "LLIMIT",
    syntax: "LLIMIT(value,pt1,...,pt15)",
    description:
      "Sets the low alarm limit for one or more points. The value comes first, followed by up to " +
      "15 point names. Value must be a decimal, point name, or local variable (not an integer). " +
      "When a point's value drops below this limit, an alarm condition is generated.",
    example: "1110 LLIMIT(-20.0, OATEMP, SPACE1)",
    category: "Point Control",
  },

  // ── Emergency Commands ────────────────────────────────────────────────────

  {
    command: "EMAUTO",
    syntax: "EMAUTO(<pt1>, ..., <pt16>)",
    description:
      "Emergency command that sets one or more points to AUTO state at emergency priority. " +
      "Overrides all other priority levels. Up to 16 points per command.",
    example: "2010 EMAUTO(SFAN1)",
    category: "Point Control",
  },
  {
    command: "EMFAST",
    syntax: "EMFAST(<pt1>, ..., <pt16>)",
    description:
      "Emergency command that sets one or more points to FAST state at emergency priority. " +
      "Used for smoke control and life-safety sequences. Up to 16 points per command.",
    example: "2020 EMFAST(EXFAN1)",
    category: "Point Control",
  },
  {
    command: "EMOFF",
    syntax: "EMOFF(<pt1>, ..., <pt16>)",
    description:
      "Emergency command that turns OFF one or more points at emergency priority. " +
      "Used for emergency shutdown sequences. Up to 16 points per command.",
    example: "2030 EMOFF(SFAN1, RFAN1)",
    category: "Point Control",
  },
  {
    command: "EMON",
    syntax: "EMON(<pt1>, ..., <pt16>)",
    description:
      "Emergency command that turns ON one or more points at emergency priority. " +
      "Used for smoke purge and pressurization sequences. Up to 16 points per command.",
    example: "2040 EMON(EXFAN1, PRFAN1)",
    category: "Point Control",
  },
  {
    command: "EMSET",
    syntax: "EMSET(value,pt1,...,pt15)",
    description:
      "Emergency command that sets one or more points to a specific value at emergency priority. " +
      "Value comes first, followed by up to 15 point names. Value can be a decimal, integer, " +
      "point name, or local variable. Used for emergency analog overrides such as damper positions.",
    example: "2050 EMSET(100.0, OADMPR, RADMPR)",
    category: "Point Control",
  },
  {
    command: "EMSLOW",
    syntax: "EMSLOW(<pt1>, ..., <pt16>)",
    description:
      "Emergency command that sets one or more points to SLOW state at emergency priority. " +
      "Up to 16 points per command.",
    example: "2060 EMSLOW(SFAN1)",
    category: "Point Control",
  },

  // ── Operators ─────────────────────────────────────────────────────────────

  {
    command: ".EQ.",
    syntax: "(<value1>.EQ.<value2>)",
    description:
      "Relational operator: Equal to. Compares two values and returns true if they are equal. " +
      "Use with caution for analog points — precise float values may not match whole numbers.",
    example: "530 IF (RMTEMP.EQ.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".NE.",
    syntax: "(<value1>.NE.<value2>)",
    description:
      "Relational operator: Not equal to. Returns true if the two values are different.",
    example: "630 IF (RMTEMP.NE.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".GT.",
    syntax: "(<value1>.GT.<value2>)",
    description:
      "Relational operator: Greater than. Returns true if value1 is strictly greater than value2.",
    example: "280 IF (RMTEMP.GT.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".LT.",
    syntax: "(<value1>.LT.<value2>)",
    description:
      "Relational operator: Less than. Returns true if value1 is strictly less than value2.",
    example: "930 IF (RMTEMP.LT.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".GE.",
    syntax: "(<value1>.GE.<value2>)",
    description:
      "Relational operator: Greater than or equal to. Returns true if value1 >= value2.",
    example: "740 IF (RMTEMP.GE.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".LE.",
    syntax: "(<value1>.LE.<value2>)",
    description:
      "Relational operator: Less than or equal to. Returns true if value1 <= value2.",
    example: "340 IF (RMTEMP.LE.80.0) THEN RMSET = 70.0",
    category: "Operators",
  },
  {
    command: ".AND.",
    syntax: "(<cond1>.AND.<cond2>)",
    description:
      "Logical operator: And. Both conditions must be true for the result to be true. " +
      "A single statement can incorporate up to 16 combined relational and logical operators.",
    example: "1010 IF (SFAN1.EQ.ON.AND.PRFON.EQ.ON) THEN NORMAL(SFAN1)",
    category: "Operators",
  },
  {
    command: ".OR.",
    syntax: "(<cond1>.OR.<cond2>)",
    description:
      "Logical operator: Or. The result is true if either condition (or both) is true.",
    example: "1010 IF (SMOKE1.EQ.ON.OR.SMOKE2.EQ.ON) THEN EMOFF(SFAN1)",
    category: "Operators",
  },
  {
    command: ".NAND.",
    syntax: "(<cond1>.NAND.<cond2>)",
    description:
      "Logical operator: Not And. The result is true unless both conditions are true. " +
      "Equivalent to NOT (cond1 AND cond2).",
    example: "1010 IF (FAN1.EQ.ON.NAND.FAN2.EQ.ON) THEN ALARM(SYSTEM)",
    category: "Operators",
  },
  {
    command: ".XOR.",
    syntax: "(<cond1>.XOR.<cond2>)",
    description:
      "Logical operator: Exclusive Or. The result is true if exactly one condition is true, " +
      "but not both.",
    example: "1010 IF (PUMP1.EQ.ON.XOR.PUMP2.EQ.ON) THEN NORMAL(SYSTEM)",
    category: "Operators",
  },

  // ── Math / Functions ──────────────────────────────────────────────────────

  {
    command: "MAX",
    syntax: "MAX(<value1>, <value2>)",
    description:
      "Returns the maximum of two values. Used for high-select logic in control programs.",
    example: "1030 MAXTEMP = MAX(ZONE1, ZONE2)",
    category: "Math/Functions",
  },
  {
    command: "MIN",
    syntax: "MIN(<value1>, <value2>)",
    description:
      "Returns the minimum of two values. Used for low-select logic in control programs.",
    example: "1040 MINTEMP = MIN(ZONE1, ZONE2)",
    category: "Math/Functions",
  },
  {
    command: "ATN",
    syntax: "ATN(<value>)",
    description: "Arithmetic function: Arc-Tangent. Returns the arctangent of the value in radians.",
    example: "1050 ANGLE = ATN(RATIO)",
    category: "Math/Functions",
  },
  {
    command: "COM",
    syntax: "COM(<value>)",
    description: "Arithmetic function: Complement. Returns the one's complement of the value.",
    example: "1060 RESULT = COM(INPUT)",
    category: "Math/Functions",
  },
  {
    command: "COS",
    syntax: "COS(<value>)",
    description: "Arithmetic function: Cosine. Returns the cosine of the value (in radians).",
    example: "1070 RESULT = COS(ANGLE)",
    category: "Math/Functions",
  },
  {
    command: "EXP",
    syntax: "EXP(<value>)",
    description: "Arithmetic function: Natural Antilog. Returns e raised to the power of the value.",
    example: "1080 RESULT = EXP(POWER)",
    category: "Math/Functions",
  },
  {
    command: "LOG",
    syntax: "LOG(<value>)",
    description: "Arithmetic function: Natural Log. Returns the natural logarithm of the value.",
    example: "1090 RESULT = LOG(INPUT)",
    category: "Math/Functions",
  },
  {
    command: ".ROOT.",
    syntax: "<value1>.ROOT.<value2>",
    description: "Arithmetic function: Root. Returns value1 to the power of (1/value2). " +
      "For example, 27.ROOT.3 returns the cube root of 27.",
    example: "1100 RESULT = 27.0.ROOT.3.0",
    category: "Math/Functions",
  },
  {
    command: "SIN",
    syntax: "SIN(<value>)",
    description: "Arithmetic function: Sine. Returns the sine of the value (in radians).",
    example: "1110 RESULT = SIN(ANGLE)",
    category: "Math/Functions",
  },
  {
    command: "SQRT",
    syntax: "SQRT(<value>)",
    description: "Arithmetic function: Square Root. Returns the square root of the value.",
    example: "1120 RESULT = SQRT(INPUT)",
    category: "Math/Functions",
  },
  {
    command: "TAN",
    syntax: "TAN(<value>)",
    description: "Arithmetic function: Tangent. Returns the tangent of the value (in radians).",
    example: "1130 RESULT = TAN(ANGLE)",
    category: "Math/Functions",
  },
  {
    command: "ALMPRI",
    syntax: "ALMPRI(<point>, <priority>)",
    description:
      "Special function: Sets the alarm priority level for a point. Priority determines " +
      "the order in which alarms are reported and displayed.",
    example: "1140 ALMPRI(SFAN1, 5)",
    category: "Math/Functions",
  },
  {
    command: "TOTAL",
    syntax: "TOTAL(<point>)",
    description:
      "Special function: Returns the totalized (accumulated) value of a point. " +
      "Used for energy metering and runtime tracking.",
    example: "1150 RUNTIME = TOTAL(SFAN1)",
    category: "Math/Functions",
  },

  // ── Time / Schedule ───────────────────────────────────────────────────────

  {
    command: "TOD",
    syntax: "TOD(<start_time>, <stop_time>, <action>)",
    description:
      "Time-of-Day command for digital points. Schedules actions based on time of day. " +
      "Start and stop times are in decimal time format (e.g., 8.00 for 8:00 AM).",
    example: "1010 TOD(8.00, 17.00, ON(SFAN1))",
    category: "Time/Schedule",
  },
  {
    command: "TODSET",
    syntax: "TODSET(<point>, <time>, <value>)",
    description:
      "Time-of-Day command for analog points. Sets an analog value at a specified time. " +
      "Used for scheduled setpoint changes based on occupancy.",
    example: "1020 TODSET(CLGSET, 8.00, 74.0)",
    category: "Time/Schedule",
  },
  {
    command: "TODMOD",
    syntax: "TODMOD(<point>, <schedule_data>)",
    description:
      "Time-of-Day mode command. Modifies the TOD schedule modes for a point. " +
      "Used to set day, night, and holiday operating modes based on time schedules.",
    example: "1030 TODMOD(SFAN1, DAYMOD)",
    category: "Time/Schedule",
  },
  {
    command: "DAY",
    syntax: "DAY(<pt1>, ..., <pt16>)",
    description:
      "Sets one or more points to DAY mode. Used for switching equipment to daytime " +
      "(occupied) operating schedules. Up to 16 points per command.",
    example: "1040 DAY(SFAN1, RFAN1)",
    category: "Time/Schedule",
  },
  {
    command: "NIGHT",
    syntax: "NIGHT(<pt1>, ..., <pt16>)",
    description:
      "Sets one or more points to NIGHT mode. Used for switching equipment to nighttime " +
      "(unoccupied) operating schedules. Up to 16 points per command.",
    example: "1050 NIGHT(SFAN1, RFAN1)",
    category: "Time/Schedule",
  },
  {
    command: "HOLIDA",
    syntax: "HOLIDA(month1,day1,...,month8,day8)",
    description:
      "Defines the dates of holidays up to a year in advance. Takes month/day pairs — " +
      "up to 8 holidays per command. Multiple HOLIDA commands can be used for more than 8 dates. " +
      "Must precede any TOD or TODSET commands. When a holiday date occurs, the TODMOD mode is set to 16.",
    example: "630 HOLIDA(12,24,12,25,12,26,12,27)",
    category: "Time/Schedule",
  },
  {
    command: "LOOP",
    syntax: "LOOP(<time_point>, <start_line>, <end_line>)",
    description:
      "Loop control command. Evaluates a block of program lines at a specified time interval. " +
      "The time point controls the execution frequency. Time-based commands must be evaluated " +
      "through every pass of the program for proper operation.",
    example: "1010 LOOP(TIMER1, 2000, 2100)",
    category: "Time/Schedule",
  },
  {
    command: "WAIT",
    syntax: "WAIT(<time>)",
    description:
      "Suspends execution of the program for the specified time period. Time is in seconds. " +
      "The program resumes at the next line after the wait period expires. " +
      "Time-based commands should be evaluated through every pass of the program.",
    example: "1070 WAIT(30)",
    category: "Time/Schedule",
  },
  {
    command: "SAMPLE",
    syntax: "SAMPLE(sec) line",
    description:
      "Executes the specified PPCL statement at the given time interval in seconds. The seconds " +
      "parameter is inside parentheses; the statement follows outside. The statement cannot include " +
      "timing functions (WAIT, PDL, TOD, TIMAVG, LOOP, SSTO, or another SAMPLE). Executes immediately " +
      "on power return, after ENABLE, or on first execution after database load.",
    example: "200 SAMPLE(600) ON(HALFAN)",
    category: "Time/Schedule",
  },
  {
    command: "TIMAVG",
    syntax: "TIMAVG(<point>, <period>, <result>)",
    description:
      "Calculates the average value of a point over a specified time period. " +
      "Used for trend analysis and average temperature calculations.",
    example: "1090 TIMAVG(OATEMP, 60, AVGTEMP)",
    category: "Time/Schedule",
  },
  {
    command: "SSTO",
    syntax: "SSTO(<point>, <parameters>)",
    description:
      "Start/Stop Time Optimization. Adjusts equipment start and stop times based on " +
      "thermal characteristics of the building to minimize energy use while maintaining comfort. " +
      "Calculates optimal pre-start times using building thermal constants.",
    example: "1010 SSTO(SFAN1, OATEMP, SPACE1, CLGSET, HTGSET)",
    category: "Time/Schedule",
  },
  {
    command: "SSTOCO",
    syntax: "SSTOCO(<parameters>)",
    description:
      "SSTO Coefficients command. Defines the thermal coefficients used by the SSTO algorithm " +
      "to calculate optimal start/stop times. Parameters include heating and cooling rate constants.",
    example: "1020 SSTOCO(0.5, 1.2, 0.8, 1.5)",
    category: "Time/Schedule",
  },
  {
    command: "INITTO",
    syntax: "INITTO(value,pt1,...,pt15)",
    description:
      "Initializes totalized values for one or more points. The value comes first (replaces current " +
      "totalized value), followed by up to 15 point names. Value must be a decimal, point name, or " +
      "local variable (not an integer). Typically used at the start of an energy metering period.",
    example: "1010 INITTO(0.0, KWHTOT)",
    category: "Time/Schedule",
  },

  // ── System ────────────────────────────────────────────────────────────────

  {
    command: "DEFINE",
    syntax: "DEFINE(<abbreviation>, <full_name>)",
    description:
      "Defines an abbreviation for a point name. Allows using short point names in the program " +
      "that map to longer database point names (greater than 6 characters). " +
      "Point names longer than 6 characters must be enclosed in double quotes.",
    example: '1000 DEFINE(SFAN1, "BUILDING1.AHU01.SFAN")',
    category: "System",
  },
  {
    command: "LOCAL",
    syntax: "LOCAL(<variable>, <value>)",
    description:
      "Declares and initializes a local variable ($LOC1 through $LOC15). " +
      "Local variables are scoped to the current program and can be used for intermediate " +
      "calculations. Values persist across program scans until explicitly changed.",
    example: "1010 LOCAL($LOC1, 0.0)",
    category: "System",
  },
  {
    command: "ONPWRT",
    syntax: "ONPWRT(line#)",
    description:
      "On-Power-Return command. Specifies the line number at which execution begins after " +
      "returning from a power failure. Line number must be an integer from 1 to 32,767. " +
      "If the line number is invalid, the command is ignored. Executed only on the first pass " +
      "after power return.",
    example: "10 ONPWRT(100)",
    category: "System",
  },
  {
    command: "STATE",
    syntax: "STATE(<point>, <text>)",
    description:
      "Assigns a custom state text string to a point. Used to provide meaningful status " +
      "descriptions visible to operators at the HMI/MMI interface.",
    example: '1010 STATE(AHU1, "HEATING MODE")',
    category: "System",
  },
  {
    command: "TABLE",
    syntax: "TABLE(<result>, <index>, <x1>, <y1>, <x2>, <y2>, ...)",
    description:
      "Defines a lookup table that maps index values to corresponding output values using " +
      "linear interpolation between coordinate pairs. Used for reset schedules, " +
      "linearization of non-linear sensors, and staged output sequencing.",
    example: "1010 TABLE(CLGSET, OATEMP, 60.0, 78.0, 90.0, 72.0)",
    category: "System",
  },
  {
    command: "PDL",
    syntax: "PDL(<parameters>)",
    description:
      "Peak Demand Limiting. Monitors electrical demand and sheds loads to keep consumption " +
      "below a setpoint. Automatically restores loads when demand drops. " +
      "Uses PDLDAT, PDLDPG, PDLMTR, and PDLSET for configuration.",
    example: "1010 PDL(METER1, PDLSP)",
    category: "System",
  },
  {
    command: "PDLDAT",
    syntax: "PDLDAT(<point>, <attributes>)",
    description:
      "PDL Define Load Attributes. Defines the characteristics of loads available for " +
      "demand limiting including load priority, minimum on/off times, and demand reduction value.",
    example: "1020 PDLDAT(SFAN1, 3, 300, 300, 15.0)",
    category: "System",
  },
  {
    command: "PDLDPG",
    syntax: "PDLDPG(<points>)",
    description:
      "PDL Digital Point Group. Defines a group of digital (binary) points that participate " +
      "in peak demand limiting load shedding.",
    example: "1030 PDLDPG(SFAN1, SFAN2, SFAN3)",
    category: "System",
  },
  {
    command: "PDLMTR",
    syntax: "PDLMTR(<meter_point>, <parameters>)",
    description:
      "PDL Meter Monitor. Defines the meter point and parameters used to monitor " +
      "electrical demand for the PDL algorithm.",
    example: "1040 PDLMTR(KWH1, 15, 1000.0)",
    category: "System",
  },
  {
    command: "PDLSET",
    syntax: "PDLSET(<setpoint>, <parameters>)",
    description:
      "PDL Setpoints. Defines the demand limiting setpoints and control parameters " +
      "for the PDL algorithm including demand target and deadband.",
    example: "1050 PDLSET(500.0, 50.0)",
    category: "System",
  },
  {
    command: "DC",
    syntax: "DC(<parameters>)",
    description:
      "Duty Cycling. Cycles equipment on and off at specified intervals to reduce energy " +
      "consumption during periods of low demand. Maintains acceptable comfort levels " +
      "while reducing runtime hours.",
    example: "1010 DC(SFAN1, 45, 15)",
    category: "System",
  },
  {
    command: "DCR",
    syntax: "DCR(<parameters>)",
    description:
      "Duty Cycle Routine. Provides more sophisticated duty cycling with temperature-based " +
      "override to ensure comfort limits are maintained during cycling operations.",
    example: "1020 DCR(SFAN1, 45, 15, SPACE1, 72.0, 76.0)",
    category: "System",
  },
  {
    command: "ADAPTM",
    syntax: "ADAPTM(<parameters>)",
    description:
      "Adaptive control for multiple points. Provides adaptive (self-tuning) PID control " +
      "for multiple analog loops. Automatically adjusts control parameters based on " +
      "system response to maintain optimal performance.",
    example: "1010 ADAPTM(CHW1, SPACE1, CLGSET, 74.0, 0.5, 2.0)",
    category: "System",
  },
  {
    command: "ADAPTS",
    syntax: "ADAPTS(<parameters>)",
    description:
      "Adaptive control for a single point. Provides adaptive (self-tuning) PID control " +
      "for a single analog loop. Automatically adjusts control parameters based on " +
      "system response.",
    example: "1020 ADAPTS(CHW1, SPACE1, CLGSET)",
    category: "System",
  },
  {
    command: "DBSWIT",
    syntax: "DBSWIT(<switch_value>)",
    description:
      "Dead Band Switch. Provides on/off control with adjustable deadband to prevent " +
      "short cycling of equipment. The switch point turns on at one value and off at another, " +
      "with the difference being the deadband.",
    example: "1010 DBSWIT(SFAN1, SPACE1, 74.0, 2.0)",
    category: "System",
  },

  // ── Communication ─────────────────────────────────────────────────────────

  {
    command: "OIP",
    syntax: "OIP(<parameters>)",
    description:
      "Operator Interface Program. Provides a custom operator display at the field panel " +
      "HMI/MMI port. Allows operators to view point values and make adjustments " +
      "through a structured menu interface.",
    example: "1010 OIP(OATEMP, SPACE1, CLGSET, HTGSET)",
    category: "Communication",
  },
  {
    command: "DISALM",
    syntax: "DISALM(<pt1>, ..., <pt16>)",
    description:
      "Disables alarm reporting for one or more points. Up to 16 points can have alarms " +
      "disabled by a single command. The point status changes to *PDSB* after being DISALMed. " +
      "Cannot disable alarms for points on other devices over the network.",
    example: "1010 IF (SFAN.EQ.OFF) THEN DISALM(ROOM1) ELSE ENALM(ROOM1)",
    category: "Communication",
  },
  {
    command: "ENALM",
    syntax: "ENALM(<pt1>, ..., <pt16>)",
    description:
      "Enables alarm reporting for one or more points. Up to 16 points can have alarms " +
      "enabled by a single command. Restores alarm reporting after DISALM.",
    example: "1020 ENALM(ROOM1, ROOM2, ROOM3)",
    category: "Communication",
  },
  {
    command: "DISCOV",
    syntax: "DISCOV(<pt1>, ..., <pt16>)",
    description:
      "Disables Change-of-Value (COV) reporting for one or more points. " +
      "Reduces network traffic by stopping automatic value change notifications. " +
      "Up to 16 points per command.",
    example: "1030 DISCOV(OATEMP, SPACE1)",
    category: "Communication",
  },
  {
    command: "ENCOV",
    syntax: "ENCOV(<pt1>, ..., <pt16>)",
    description:
      "Enables Change-of-Value (COV) reporting for one or more points. " +
      "Restores COV notifications after DISCOV. Up to 16 points per command.",
    example: "1040 ENCOV(OATEMP, SPACE1)",
    category: "Communication",
  },
  {
    command: "DPHONE",
    syntax: "DPHONE(<pt1>, ..., <pt16>)",
    description:
      "Disables phone-out alarm notification for one or more points. " +
      "Stops the system from calling out alarms for the specified points. " +
      "Up to 16 points per command.",
    example: "1050 DPHONE(ROOM1)",
    category: "Communication",
  },
  {
    command: "EPHONE",
    syntax: "EPHONE(<pt1>, ..., <pt16>)",
    description:
      "Enables phone-out alarm notification for one or more points. " +
      "Restores phone-out alarm calling after DPHONE. Up to 16 points per command.",
    example: "1060 EPHONE(ROOM1)",
    category: "Communication",
  },
];
