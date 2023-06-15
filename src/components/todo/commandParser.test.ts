import { parseCommand } from './commandParser';

export default describe('Command parser', () => {
  const exampleContext = { currentLine: 20, lastLine: 50 };

  describe('General', () => {
    it('should not parse the empty string', () => {
      const parsed = parseCommand('');
      expect(parsed.command).toBe(false);
    });

    it('should not parse a string with no command', () => {
      const parsed = parseCommand('21,0z6');
      expect(parsed.command).toBe(false);
    });
  });

  describe('Insert', () => {
    it('should not parse ":20,21i10"', () => {
      const parsed1 = parseCommand(':20,21i10');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':20,21i10', exampleContext);
      expect(parsed2.command).toBe(false);
    });
    
    it('should parse ":21i10"', () => {
      const parsed1 = parseCommand(':21i10');
      expect(parsed1).toStrictEqual({
        command: 'i',
        range: { start: 21, end: 21 },
        arg: 10,
      });
      const parsed2 = parseCommand(':21i10', exampleContext);
      expect(parsed2).toStrictEqual(parsed1);
    });

    it('should parse ":i" only with context', () => {
      const parsed1 = parseCommand(':i');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':i', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'i',
        range: { start: 20, end: 20 },
        arg: 1,
      });
    });

    it('should parse ":i10" only with context', () => {
      const parsed1 = parseCommand(':i10');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':i10', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'i',
        range: { start: 20, end: 20 },
        arg: 10,
      });
    });

    it('should not parse ":i10,"', () => {
      const parsed1 = parseCommand(':i10,');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':i10,', exampleContext);
      expect(parsed2.command).toBe(false);
    });
  });

  describe('Move', () => {
    it('should not parse ":m"', () => {
      const parsed1 = parseCommand(':m');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':m', exampleContext);
      expect(parsed2.command).toBe(false);
    });

    it('should parse ":50,22m14"', () => {
      const parsed1 = parseCommand(':50,22m14');
      expect(parsed1).toStrictEqual({
        command: 'm',
        range: { start: 22, end: 50 },
        arg: 14,
      });
      const parsed2 = parseCommand(':50,22m14', exampleContext);
      expect(parsed2).toStrictEqual(parsed1);
    });

    it('should parse ":.m10" only with context', () => {
      const parsed1 = parseCommand(':.m10');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':.m10', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'm',
        range: { start: 20, end: 20 },
        arg: 10,
      });
    });

    it('should parse ":.,+1m10" only with context', () => {
      const parsed1 = parseCommand(':.,+1m10');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':.,+1m10', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'm',
        range: { start: 20, end: 21 },
        arg: 10,
      });
    });
  });

  describe('Delete', () => {
    it('should parse ":20,21d"', () => {
      const parsed1 = parseCommand(':20,21d');
      expect(parsed1).toStrictEqual({
        command: 'd',
        range: { start: 20, end: 21 },
      });
      const parsed2 = parseCommand(':20,21d', exampleContext);
      expect(parsed2).toStrictEqual(parsed1);
    });
    
    it('should parse ":21d"', () => {
      const parsed1 = parseCommand(':21d');
      expect(parsed1).toStrictEqual({
        command: 'd',
        range: { start: 21, end: 21 },
      });
      const parsed2 = parseCommand(':21d', exampleContext);
      expect(parsed2).toStrictEqual(parsed1);
    });

    it('should parse ":d" only with context', () => {
      const parsed1 = parseCommand(':d');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':d', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'd',
        range: { start: 20, end: 20 },
      });
    });

    it('should parse ":.,$d" only with context', () => {
      const parsed1 = parseCommand(':.,$d');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':.,$d', exampleContext);
      expect(parsed2).toStrictEqual({
        command: 'd',
        range: { start: 20, end: 50 },
      });
    });

    it('should not parse ":1d1"', () => {
      const parsed1 = parseCommand(':1d1');
      expect(parsed1.command).toBe(false);
      const parsed2 = parseCommand(':1d1', exampleContext);
      expect(parsed2.command).toBe(false);
    });
  });
});
