import { escapeCsvValue, generateCSV } from '../../../../apps/studio/components/ui/csv-utils';

describe('CSV Utilities', () => {
  describe('escapeCsvValue', () => {
    it('wraps simple text in quotes', () => {
      expect(escapeCsvValue('simple')).toBe('"simple"');
    });

    it('doubles internal quotes', () => {
      expect(escapeCsvValue('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    it('converts numbers to strings', () => {
      expect(escapeCsvValue(123)).toBe('"123"');
    });

    it('converts booleans to strings', () => {
      expect(escapeCsvValue(true)).toBe('"true"');
      expect(escapeCsvValue(false)).toBe('"false"');
    });

    it('handles null and undefined gracefully', () => {
      // Using String() conversion
      expect(escapeCsvValue(null)).toBe('"null"');
      expect(escapeCsvValue(undefined)).toBe('"undefined"');
    });
  });

  describe('generateCSV', () => {
    it('generates correct CSV output for given headers and data', () => {
      const headers = ['id', 'name'];
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const expectedCSV = `"id","name"\n"1","Alice"\n"2","Bob"`;
      expect(generateCSV(headers, data)).toBe(expectedCSV);
    });

    it('fills missing keys with an empty string', () => {
      const headers = ['id', 'name', 'age'];
      const data = [{ id: 1, name: 'Alice' }];
      const expectedCSV = `"id","name","age"\n"1","Alice",""`;
      expect(generateCSV(headers, data)).toBe(expectedCSV);
    });

    it('generates CSV for an empty data array, outputting only headers', () => {
      const headers = ['id', 'name'];
      const data: any[] = [];
      const expectedCSV = `"id","name"`;
      expect(generateCSV(headers, data)).toBe(expectedCSV);
    });
  });
});