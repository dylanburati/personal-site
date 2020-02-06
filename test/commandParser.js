import { parseLineCommand } from '../src/components/todo/commandParser';
import * as assert from 'assert';

describe('Command parser', () => {
  const exampleContext = { currentLine: 20, lastLine: 50 };

  describe('General', () => {
    it('should not parse the empty string', () => {
      const parsed = parseLineCommand('');
      assert.ok(parsed.error);
    });

    it('should not parse a string with no command', () => {
      const parsed = parseLineCommand('21,0z6');
      assert.ok(parsed.error);
    });
  });

  describe('Insert without context', () => {
    it('should not parse ":i"', () => {
      const parsed = parseLineCommand(':i');
      assert.ok(parsed.error);
    });

    it('should parse ":21i"', () => {
      const parsed = parseLineCommand(':21i');
      assert.deepStrictEqual(parsed, {
        command: 'i',
        range: { start: 21, end: 21 },
        args: [1],
      });
    });

    it('should parse ":21i10"', () => {
      const parsed = parseLineCommand(':21i10');
      assert.deepStrictEqual(parsed, {
        command: 'i',
        range: { start: 21, end: 21 },
        args: [10],
      });
    });

    it('should not parse ":21i10,"', () => {
      const parsed = parseLineCommand(':21i10,');
      assert.ok(parsed.error);
    });

    it('should not parse ":21,21,21i10"', () => {
      const parsed = parseLineCommand(':21,21,21i10');
      assert.ok(parsed.error);
    });
  });

  describe('Insert with context', () => {
    it('should parse ":i"', () => {
      const parsed = parseLineCommand(':i', exampleContext);
      assert.deepStrictEqual(parsed, {
        command: 'i',
        range: { start: 20, end: 20 },
        args: [1],
      });
    });

    it('should parse ":i10"', () => {
      const parsed = parseLineCommand(':i10', exampleContext);
      assert.deepStrictEqual(parsed, {
        command: 'i',
        range: { start: 20, end: 20 },
        args: [10],
      });
    });

    it('should not parse ":i10,"', () => {
      const parsed = parseLineCommand(':i10,', exampleContext);
      assert.ok(parsed.error);
    });
  });

  describe('Move without context', () => {
    it('should not parse ":21m"', () => {
      const parsed = parseLineCommand(':21m');
      assert.ok(parsed.error);
    });

    it('should not parse ":.m10"', () => {
      const parsed = parseLineCommand(':.m10');
      assert.ok(parsed.error);
    });

    it('should not parse ":-1,m10"', () => {
      const parsed = parseLineCommand(':-1,m10');
      assert.ok(parsed.error);
    });

    it('should parse ":50,22m14"', () => {
      const parsed = parseLineCommand(':50,22m14');
      assert.deepStrictEqual(parsed, {
        command: 'm',
        range: { start: 22, end: 50 },
        args: [14],
      });
    });
  });

  describe('Move with context', () => {
    it('should not parse ":m"', () => {
      const parsed = parseLineCommand(':m', exampleContext);
      assert.ok(parsed.error);
    });

    it('should parse ":.m10"', () => {
      const parsed = parseLineCommand(':.m10', exampleContext);
      assert.deepStrictEqual(parsed, {
        command: 'm',
        range: { start: 20, end: 20 },
        args: [10],
      });
    });

    it('should parse ":-1,m10"', () => {
      const parsed = parseLineCommand(':-1,m10', exampleContext);
      assert.deepStrictEqual(parsed, {
        command: 'm',
        range: { start: 19, end: 50 },
        args: [10],
      });
    });

    it('should parse ":$,+2m14"', () => {
      const parsed = parseLineCommand(':$,+2m14', exampleContext);
      assert.deepStrictEqual(parsed, {
        command: 'm',
        range: { start: 22, end: 50 },
        args: [14],
      });
    });
  });
});
