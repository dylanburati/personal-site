import {
  Result,
  Parser,
  add,
  alt,
  char,
  consecutive,
  map,
  optional,
  preceded,
  satisfy,
  tag,
  takeTill,
  takeWhile,
  terminated,
} from "./attoparsec";

export type CommandContext = { currentLine?: number; lastLine?: number };
export type LineRange = { start: number; end: number };
type Addr =
  | { kind: "start" }
  | { kind: "end" }
  | {
      kind: "relative";
      value: number;
    }
  | { kind: "absolute"; value: number };
type ParsedCommand =
  | { command: "w"; arg: string }
  | { command: "schema"; arg: string }
  | { command: "share"; arg: string }
  | { command: "i"; range: [Addr, Addr]; arg: number }
  | { command: "m"; range: [Addr, Addr]; arg: Addr }
  | { command: "d"; range: [Addr, Addr] };

export type CommandResult =
  | { command: "w"; arg: string }
  | { command: "schema"; arg: string }
  | { command: "share"; arg: string }
  | { command: "i"; range: LineRange; arg: number }
  | { command: "m"; range: LineRange; arg: number }
  | { command: "d"; range: LineRange }
  | { command: false; reason: string };

const writeParser: Parser<string, ParsedCommand> = map(
  preceded(tag("w "), takeTill(/$/)),
  (arg) => ({
    command: "w",
    arg,
  })
);
const schemaParser: Parser<string, ParsedCommand> = map(
  preceded(tag("schema "), takeTill(/$/)),
  (arg) => ({
    command: "schema",
    arg,
  })
);
const shareParser: Parser<string, ParsedCommand> = map(
  preceded(tag("share "), takeTill(/$/)),
  (arg) => ({
    command: "share",
    arg,
  })
);
const intParser = alt(char("0"), add(satisfy(/[1-9]/), takeWhile(/[0-9]/)));
const addrParser: Parser<string, Addr> = alt(
  map(char("."), (): Addr => ({ kind: "relative", value: 0 })),
  map(char("^"), (): Addr => ({ kind: "start" })),
  map(char("$"), () => ({ kind: "end" })),
  map(intParser, (s) => ({ kind: "absolute", value: parseInt(s, 10) })),
  map(add(satisfy(/[+-]/), intParser), (s) => ({
    kind: "relative",
    value: parseInt(s, 10),
  }))
);
const addrOrHereParser = optional(addrParser, { kind: 'relative', value: 0 })
const longhandRangeParser: Parser<string, [Addr, Addr]> = map(
  consecutive(addrParser, optional(preceded(char(","), addrParser), null)),
  ([start, maybeEnd]) =>
    maybeEnd !== null ? [start, maybeEnd] : [start, start]
);
const shorthandRangeParser = map(char("%"), (): [Addr, Addr] => [
  { kind: "start" },
  { kind: "end" },
]);
const rangeOrHereParser = optional(
  alt(shorthandRangeParser, longhandRangeParser),
  [
    { kind: "relative", value: 0 },
    { kind: "relative", value: 0 },
  ]
);
const insertParser: Parser<string, ParsedCommand> = map(
  consecutive(addrOrHereParser, preceded(char("i"), optional(intParser, "1"))),
  ([start, argStr]) => ({
    command: "i",
    range: [start, start],
    arg: parseInt(argStr, 10),
  })
);
const moveParser: Parser<string, ParsedCommand> = map(
  consecutive(rangeOrHereParser, preceded(char("m"), addrParser)),
  ([range, addr]) => ({
    command: "m",
    range,
    arg: addr,
  })
);
const deleteParser: Parser<string, ParsedCommand> = map(
  terminated(rangeOrHereParser, char("d")),
  (range) => ({
    command: "d",
    range,
  })
);
const vimParser = alt(
  writeParser,
  schemaParser,
  shareParser,
  insertParser,
  moveParser,
  deleteParser
);

function tryResolveLine(
  addr: Addr,
  context: CommandContext
): number | undefined {
  switch (addr.kind) {
    case "start":
      return 1;
    case "end":
      return context.lastLine;
    case "absolute":
      return addr.value;
    case "relative":
      return context.currentLine !== undefined
        ? context.currentLine + addr.value
        : undefined;
  }
}

/**
 * Parse a Vim-style command operating either on the file: [w]rite, set [schema], [share];
 * or on lines: [i]nsert, [m]ove, or [d]elete.
 */
export function parseCommand(
  input: string,
  context: CommandContext = {}
): CommandResult {
  if (!input.startsWith(":")) {
    return { command: false, reason: "No command" };
  }
  const [remaining, res] = vimParser.parse(input.slice(1));
  if (remaining.length > 0) {
    return { command: false, reason: "Trailing characters: " + remaining };
  }
  if (res.kind === Result.ERR) {
    return { command: false, reason: "Parse error: " + res.getError() };
  }
  const parsed = res.unwrap();
  switch (parsed.command) {
    case "w":
      if (parsed.arg.length < 1)
        return { command: false, reason: "Name too short" };
      if (parsed.arg.length > 64)
        return { command: false, reason: "Name too long" };
      if (parsed.arg.includes("/"))
        return { command: false, reason: "Name must not contain a slash" };
      return parsed;
    case "schema":
    case "share":
      return parsed;
    default:
      const [startAddr, endAddr] = parsed.range;
      const istart = tryResolveLine(startAddr, context);
      if (istart === undefined) {
        return {
          command: false,
          reason: `Start address not found: ${
            startAddr.kind === "relative" ? "current" : "last"
          } line not provided`,
        };
      }
      const iend = tryResolveLine(endAddr, context);
      if (iend === undefined) {
        return {
          command: false,
          reason: `End address not found: ${
            endAddr.kind === "relative" ? "current" : "last"
          } line not provided`,
        };
      }
      const [start, end] = istart > iend ? [iend, istart] : [istart, iend];
      if (
        start < 0 ||
        (context.lastLine !== undefined && end > context.lastLine)
      ) {
        return {
          command: false,
          reason: `Can not operate on range [${start}, ${end}]`,
        };
      }
      if (parsed.command === "i") {
        return {
          command: parsed.command,
          range: { start, end },
          arg: parsed.arg,
        };
      }
      if (parsed.command === "d") {
        return {
          command: parsed.command,
          range: { start, end },
        };
      }
      const dest = tryResolveLine(parsed.arg, context);
      if (dest === undefined) {
        return {
          command: false,
          reason: `Destination address not found: ${
            endAddr.kind === "relative" ? "current" : "last"
          } line not provided`,
        };
      }
      if (
        dest < 0 ||
        (context.lastLine !== undefined && dest > context.lastLine)
      ) {
        return {
          command: false,
          reason: `Can not move to line ${dest}`,
        };
      }
      return {
        command: parsed.command,
        range: { start, end },
        arg: dest,
      };
  }
}
