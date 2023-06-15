export const OK = Symbol("OK");
export const ERR = Symbol("ERR");

export type ResultKind = typeof OK | typeof ERR;

export interface Result<T> {
  kind: ResultKind;
  map<R>(f: (a: T) => R): Result<R>;
  tryMap<R>(f: (a: T) => Result<R>): Result<R>;
  validate(msg: string, f: (a: T) => boolean): Result<T>;
  unwrap(): T;
  getError(): string;
}

class Ok<T> {
  kind: typeof OK;
  val: T;

  constructor(val: T) {
    this.kind = OK;
    this.val = val;
  }

  map<R>(f: (a: T) => R): Ok<R> {
    return new Ok(f(this.val));
  }

  tryMap<R>(f: (a: T) => Result<R>): Result<R> {
    return f(this.val);
  }

  validate(msg: string, f: (a: T) => boolean): Result<T> {
    if (!f(this.val)) {
      return new Err(msg);
    }
    return this;
  }

  unwrap(): T {
    return this.val;
  }

  getError(): never {
    throw new Error("Ok.getError()");
  }
}

class Err {
  kind: typeof ERR;
  msg: string;

  constructor(msg: string) {
    this.kind = ERR;
    this.msg = msg;
  }

  map<R>(f: (a: any) => R): Err {
    return this;
  }

  tryMap<R>(f: (a: any) => Result<R>): Err {
    return this;
  }

  validate(msg: string, f: (a: any) => boolean): Err {
    return this;
  }

  unwrap(): never {
    throw new Error(this.msg);
  }

  getError(): string {
    return this.msg;
  }
}

export interface Parser<I, T> {
  parse(input: I): [I, Result<T>];
}

/**
 * Recognizes the next character.
 */
export function anyChar(): Parser<string, string> {
  return {
    parse(input) {
      if (input.length === 0) {
        return [input, new Err("anyChar")];
      }
      return [input.slice(1), new Ok(input[0])];
    },
  };
}

/**
 * Recognizes one character.
 */
export function char(c: string): Parser<string, string> {
  return {
    parse(input) {
      if (input.length === 0 || input[0] !== c) {
        return [input, new Err("char")];
      }
      return [input.slice(1), new Ok(input[0])];
    },
  };
}

type Predicate<I> = (input: I) => boolean;
type CharPredicate = Predicate<string>;

/**
 * Recognizes one character and checks that it satisfies a predicate.
 */
export function satisfy(test: RegExp | CharPredicate): Parser<string, string> {
  const testFn =
    typeof test === "function" ? test : (c: string) => test.test(c);
  return {
    parse(input) {
      if (input.length === 0 || !testFn(input[0])) {
        return [input, new Err("satisfy")];
      }
      return [input.slice(1), new Ok(input[0])];
    },
  };
}

/**
 * Recognizes a substring at the start of the input.
 */
export function tag(s: string): Parser<string, string> {
  return {
    parse(input) {
      if (!input.startsWith(s)) {
        return [input, new Err("tag")];
      }
      return [input.slice(s.length), new Ok(s)];
    },
  };
}

function takeWhileM(
  min: number,
  test: RegExp | CharPredicate
): Parser<string, string> {
  const testFn =
    typeof test === "function" ? test : (c: string) => test.test(c);
  return {
    parse(input) {
      let end = 0;
      for (; end < input.length; end++) {
        if (!testFn(input[end])) {
          break;
        }
      }
      if (end < min) {
        return [input, new Err("takeWhileM")];
      }
      return [input.slice(end), new Ok(input.slice(0, end))];
    },
  };
}

/**
 * Returns the input slice up to the first position where the predicate
 * returns false.
 *
 * This parser does not fail.
 */
export function takeWhile(
  test: RegExp | CharPredicate
): Parser<string, string> {
  return takeWhileM(0, test);
}

/**
 * Returns the input slice up to the first position where the predicate
 * returns false.
 *
 * This parser does not fail.
 */
export function takeWhile1(
  test: RegExp | CharPredicate
): Parser<string, string> {
  return takeWhileM(0, test);
}

function takeTillM(
  min: number,
  pattern: string | RegExp
): Parser<string, string> {
  return {
    parse(input) {
      let end: number;
      if (typeof pattern === "string") {
        const i = input.indexOf(pattern);
        end = i >= 0 ? i : input.length;
      } else {
        const m = pattern.exec(input);
        end = m != null ? m.index : input.length;
      }
      if (end < min) {
        return [input, new Err("takeTillM")];
      }
      return [input.slice(end), new Ok(input.slice(0, end))];
    },
  };
}

/**
 * Returns the input slice up to the first occurrence of the pattern.
 *
 * It doesn’t consume the pattern. If the pattern is not found, this returns
 * the entire input. This parser does not fail.
 */
export function takeTill(pattern: string | RegExp): Parser<string, string> {
  return takeTillM(0, pattern);
}

/**
 * Returns the input slice up to the first occurrence of the pattern.
 *
 * It doesn’t consume the pattern. If the pattern is not found, this returns
 * the entire input. This parser fails if the returned slice would be empty.
 */
export function takeTill1(pattern: string | RegExp): Parser<string, string> {
  return takeTillM(1, pattern);
}

function manyMN<I, R>(
  min: number,
  max: number,
  parser: Parser<I, R>
): Parser<I, R[]> {
  return {
    parse(input) {
      let current = input;
      const result: R[] = [];
      while (result.length < max) {
        let [next, item] = parser.parse(current);
        if (item.kind === OK) {
          result.push(item.unwrap());
          current = next;
        } else if (result.length < min) {
          return [input, new Err("manyMN " + item.getError())];
        } else {
          return [current, new Ok(result)];
        }
      }
      return [current, new Ok(result)];
    },
  };
}

/**
 * Repeats the embedded parser a specified number of times and collects the
 * results in an array.
 */
export function count<I, R>(n: number, parser: Parser<I, R>): Parser<I, R[]> {
  return manyMN(n, n, parser);
}

const _VERY_LARGE = 0xf_ffff_ffff_ffff;

/**
 * Repeats the embedded parser and collects the results in an array. This
 * parser does not fail.
 */
export function many<I, R>(parser: Parser<I, R>): Parser<I, R[]> {
  return manyMN(0, _VERY_LARGE, parser);
}

/**
 * Repeats the embedded parser and collects the results in an array. This
 * parser does not fail.
 */
export function many1<I, R>(parser: Parser<I, R>): Parser<I, R[]> {
  return manyMN(1, _VERY_LARGE, parser);
}

function foldManyM<I, T, R>(
  min: number,
  parser: Parser<I, T>,
  reducer: (acc: R, cur: T) => R,
  initial: R
): Parser<I, R> {
  return {
    parse(input) {
      let current = input;
      let result: R = initial;
      let count = 0;
      while (true) {
        let [next, item] = parser.parse(current);
        if (item.kind === OK) {
          result = reducer(result, item.unwrap());
          current = next;
          count += 1;
        } else if (count < min) {
          return [input, new Err("foldManyM " + item.getError())];
        } else {
          return [current, new Ok(result)];
        }
      }
    },
  };
}

/**
 * Repeats the embedded parser, using the results to update the reducer. This
 * parser does not fail.
 */
export function foldMany<I, T, R>(
  parser: Parser<I, T>,
  reducer: (acc: R, cur: T) => R,
  initial: R
): Parser<I, R> {
  return foldManyM(0, parser, reducer, initial);
}

/**
 * Repeats the embedded parser, using the results to update the reducer. This
 * parser succeeds if the embedded parser succeeds at least once.
 */
export function foldMany1<I, T, R>(
  parser: Parser<I, T>,
  reducer: (acc: R, cur: T) => R,
  initial: R
): Parser<I, R> {
  return foldManyM(1, parser, reducer, initial);
}

/**
 * Succeeds if all the input has been consumed by its child parser.
 */
export function allConsuming<I extends string | any[], R>(
  parser: Parser<I, R>
) {
  return {
    parse(input: I) {
      const [nxt, res] = parser.parse(input);
      if (res.kind === ERR) {
        return [input, res];
      }
      if (nxt.length > 0) {
        return [input, new Err("allConsuming")];
      }
      return [nxt, res];
    },
  };
}

/**
 * Applies two parsers in sequence, and returns their results as a pair.
 */
export function consecutive<I, R1, R2>(
  parser1: Parser<I, R1>,
  parser2: Parser<I, R2>
): Parser<I, [R1, R2]> {
  return {
    parse(input) {
      const [nxt1, res1] = parser1.parse(input);
      if (res1.kind === ERR) {
        return [input, res1 as Result<[R1, R2]>];
      }
      const [nxt2, res2] = parser2.parse(nxt1);
      if (res2.kind === ERR) {
        return [input, res2 as Result<[R1, R2]>];
      }
      return [nxt2, new Ok([res1.unwrap(), res2.unwrap()])];
    },
  };
}

/**
 * Applies two parsers in sequence, and adds their results.
 */
export function add<I>(
  parser1: Parser<I, string>,
  parser2: Parser<I, string>
): Parser<I, string> {
  return {
    parse(input) {
      const [nxt1, res1] = parser1.parse(input);
      if (res1.kind === ERR) {
        return [input, res1];
      }
      const [nxt2, res2] = parser2.parse(nxt1);
      if (res2.kind === ERR) {
        return [input, res2];
      }
      return [nxt2, new Ok(res1.unwrap() + res2.unwrap())];
    },
  };
}

/**
 * Matches an object from the first parser and discards it, then gets an object from the second parser.
 */
export function preceded<I, R>(
  parser1: Parser<I, any>,
  parser2: Parser<I, R>
): Parser<I, R> {
  return {
    parse(input) {
      const [nxt1, res1] = parser1.parse(input);
      if (res1.kind === ERR) {
        return [input, res1 as Result<R>];
      }
      const [nxt2, res2] = parser2.parse(nxt1);
      if (res2.kind === ERR) {
        return [input, res2];
      }
      return [nxt2, res2];
    },
  };
}

/**
 * Gets an object from the first parser, then matches an object from the second parser and discards it.
 */
export function terminated<I, R>(
  parser1: Parser<I, R>,
  parser2: Parser<I, any>
): Parser<I, R> {
  return {
    parse(input) {
      const [nxt1, res1] = parser1.parse(input);
      if (res1.kind === ERR) {
        return [input, res1];
      }
      const [nxt2, res2] = parser2.parse(nxt1);
      if (res2.kind === ERR) {
        return [input, res2 as Result<R>];
      }
      return [nxt2, res1];
    },
  };
}

/**
 * Tests a list of parsers one by one until one succeeds.
 */
export function alt<I, R>(...parsers: Parser<I, R>[]): Parser<I, R> {
  return {
    parse(input) {
      let [nxt, res] = parsers[0].parse(input);
      if (res.kind === OK) {
        return [nxt, res];
      }
      for (let i = 1; i < parsers.length; i++) {
        [nxt, res] = parsers[i].parse(input);
        if (res.kind === OK) {
          return [nxt, res];
        }
      }
      return [input, res];
    },
  };
}

/**
 * Gets an object with the parser if possible, and returns the given default if
 * it errors.
 */
export function optional<I, R>(parser: Parser<I, R>, dfault: R): Parser<I, R> {
  return {
    parse(input) {
      const [nxt, res] = parser.parse(input);
      if (res.kind === OK) {
        return [nxt, res];
      }
      return [input, new Ok(dfault)];
    },
  };
}

/**
 * Maps a function on the result of a parser.
 */
export function map<I, T, R>(
  parser: Parser<I, T>,
  f: (a: T) => R
): Parser<I, R> {
  return {
    parse(input) {
      const [nxt, res] = parser.parse(input);
      return [nxt, res.map(f)];
    },
  };
}
