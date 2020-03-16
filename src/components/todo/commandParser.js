/**
 * @typedef {{ currentLine?: number, lastLine?: number }} CommandContext
 * @typedef {{ start: number, end: number }} LineRange
 * @typedef {{ command: string, range: LineRange, args: any[] }} CommandResult
 */

export function parseFileCommand(input) {
  if (input.startsWith(':w ')) {
    const name = input.substring(3);
    if (name.length < 1) return { error: 'Name too short' };
    if (name.length > 64) return { error: 'Name too long' };
    if (name.includes('/')) return { error: 'Name must not contain a slash' };
    return { command: 'w', args: [name] };
  }
  if (input.startsWith(':schema ')) {
    return { command: 'schema', args: [input.substring(8)] };
  }
  if (input.startsWith(':share ')) {
    return { command: 'share', args: [input.substring(7)] };
  }
  return null;
}

/**
 * Parse a Vim-style command
 *
 * @param {String} input The command text
 * @param {CommandContext} context Info about current line, last line
 * @returns {{ error: string } | CommandResult}
 */
export function parseLineCommand(input, context = {}) {
  if (!input.startsWith(':')) {
    return { error: 'No command' };
  }

  const matchers = [
    {
      regex: /^\./,
      convert: match => ({ kind: 'addr-relative', value: context.currentLine }),
    },
    {
      regex: /^\$/,
      convert: match => ({ kind: 'addr-end', value: context.lastLine }),
    },
    {
      regex: /^,/,
      convert: match => ({ kind: 'comma' }),
    },
    {
      regex: /^[0-9]+/,
      convert: match => ({ kind: 'int', value: parseInt(match[0], 10) }),
    },
    {
      regex: /^(i|m|d)/,
      convert: match => ({ kind: 'command', value: match[0] }),
    },
    {
      regex: /^\.?((-|\+)[0-9]+)/,
      convert: match => ({
        kind: 'addr-relative',
        value: context.currentLine + parseInt(match[1], 10),
      }),
    },
  ];

  const tokenList = [];
  let unparsed = input.substring(1);

  while (unparsed.length > 0) {
    // eslint-disable-next-line no-loop-func
    const matchList = matchers.map(m => ({
      ...m,
      match: m.regex.exec(unparsed),
    }));
    const success = matchList.find(m => m.match);
    if (!success) {
      return { error: `Could not parse ${unparsed}` };
    }
    if (success.match.index > 0) {
      throw new Error('Matcher invariant failed: match started past index 0');
    }
    const token = success.convert(success.match);
    if (token.kind === 'addr-relative' && context.currentLine === undefined) {
      return { error: 'Current line not provided' };
    }
    if (token.kind === 'addr-end' && context.lastLine === undefined) {
      return { error: 'Last line not provided' };
    }

    tokenList.push(token);
    unparsed = unparsed.substring(success.match[0].length);
  }

  const commandIdx = tokenList.findIndex(t => t.kind === 'command');
  if (commandIdx < 0) {
    return { error: 'No command' };
  }
  const command = tokenList[commandIdx].value;
  const range = getCommandRange(tokenList.slice(0, commandIdx), context);
  if (range.error) {
    return { error: range.error };
  }
  if (range.start <= 0) {
    return { error: 'Range start <= 0' };
  }
  if (range.end < range.start) {
    return { error: 'Unusable backwards range' };
  }

  const argc = tokenList.length - commandIdx - 1;
  switch (command) {
    case 'i':
      if (argc === 0) {
        return { command, range, args: [1] };
      }
      if (argc === 1) {
        const count = tokenList[commandIdx + 1];
        if (count.kind !== 'int') {
          return { error: 'Insert takes 1 optional int argument' };
        }
        return { command, range, args: [count.value] };
      }
      return { error: 'Insert takes 1 optional int argument' };
    case 'm':
      if (argc === 1) {
        const dst = tokenList[commandIdx + 1];
        if (!isAddr(dst)) {
          return { error: 'Move takes 1 required address argument' };
        }
        const val = Math.max(1, dst.value);
        return { command, range, args: [val] };
      }
      return { error: 'Move takes 1 required address argument' };
    case 'd':
      if (argc === 0) {
        return { command, range, args: [] };
      }
      return { error: 'Delete takes 0 arguments' };
    default:
      return { error: 'Unknown command' };
  }
}

function isAddr(token) {
  return (
    token.kind === 'int' ||
    token.kind === 'addr-relative' ||
    token.kind === 'addr-end'
  );
}

function getCommandRange(array, context) {
  if (array.length === 0) {
    if (context.currentLine === undefined) {
      return { error: 'Current line not provided' };
    }
    return { start: context.currentLine, end: context.currentLine };
  }

  const [startToken, commaToken, endToken] = array;
  if (!isAddr(startToken)) {
    return { error: 'Malformed range' };
  }
  if (array.length === 1) {
    return { start: startToken.value, end: startToken.value };
  }
  if (commaToken.kind !== 'comma') {
    return { error: 'Malformed range' };
  }
  if (array.length === 2) {
    if (context.lastLine === undefined) {
      return { error: 'Last line not provided' };
    }
    return { start: startToken.value, end: context.lastLine };
  }
  if (!isAddr(endToken)) {
    return { error: 'Malformed range' };
  }
  if (array.length === 3) {
    return {
      start: Math.min(startToken.value, endToken.value),
      end: Math.max(startToken.value, endToken.value),
    };
  }
  return { error: 'Malformed range' };
}
