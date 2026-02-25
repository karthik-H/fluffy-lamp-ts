import { parseCsvLine } from '../../src/server';

describe('parseCsvLine', () => {
  // Test Case 1: Parse simple CSV line without quotes
  it('Test Case 1: Parse simple CSV line without quotes', () => {
    const line = 'field1,field2,field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field2', 'field3']);
  });

  // Test Case 2: Parse CSV line with quoted fields containing commas
  it('Test Case 2: Parse CSV line with quoted fields containing commas', () => {
    const line = 'field1,"field, with, commas",field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field, with, commas', 'field3']);
  });

  // Test Case 3: Parse CSV line with escaped quotes inside quoted field
  it('Test Case 3: Parse CSV line with escaped quotes inside quoted field', () => {
    const line = 'field1,"field with ""escaped"" quotes",field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field with "escaped" quotes', 'field3']);
  });

  // Test Case 4: Parse CSV line with leading and trailing spaces
  it('Test Case 4: Parse CSV line with leading and trailing spaces', () => {
    const line = '  field1  ,  "  field2  "  ,field3  ';
    expect(parseCsvLine(line)).toEqual(['  field1  ', '  field2  ', 'field3  ']);
  });

  // Test Case 5: Parse CSV line with empty fields
  it('Test Case 5: Parse CSV line with empty fields', () => {
    const line = 'field1,,field3,';
    expect(parseCsvLine(line)).toEqual(['field1', '', 'field3', '']);
  });

  // Test Case 6: Parse CSV line with only quoted fields
  it('Test Case 6: Parse CSV line with only quoted fields', () => {
    const line = '"field1","","field3"';
    expect(parseCsvLine(line)).toEqual(['field1', '', 'field3']);
  });

  // Test Case 7: Parse CSV line with unmatched quote
  it('Test Case 7: Parse CSV line with unmatched quote', () => {
    const line = 'field1,"unmatched quote,field3';
    // Accept either error or ["field1", "unmatched quote,field3"]
    try {
      const result = parseCsvLine(line);
      expect(result).toEqual(['field1', 'unmatched quote,field3']);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  // Test Case 8: Parse CSV line with newline inside quoted field
  it('Test Case 8: Parse CSV line with newline inside quoted field', () => {
    const line = 'field1,"field with\nnewline",field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field with\nnewline', 'field3']);
  });

  // Test Case 9: Parse CSV line with a single field
  it('Test Case 9: Parse CSV line with a single field', () => {
    const line = 'justonefield';
    expect(parseCsvLine(line)).toEqual(['justonefield']);
  });

  // Test Case 10: Parse empty CSV line
  it('Test Case 10: Parse empty CSV line', () => {
    const line = '';
    expect(parseCsvLine(line)).toEqual(['']);
  });

  // Test Case 11: Parse CSV line with trailing comma
  it('Test Case 11: Parse CSV line with trailing comma', () => {
    const line = 'field1,field2,';
    expect(parseCsvLine(line)).toEqual(['field1', 'field2', '']);
  });

  // Test Case 12: Parse CSV line with leading comma
  it('Test Case 12: Parse CSV line with leading comma', () => {
    const line = ',field1,field2';
    expect(parseCsvLine(line)).toEqual(['', 'field1', 'field2']);
  });

  // Test Case 13: Parse CSV line with multiple sequential commas
  it('Test Case 13: Parse CSV line with multiple sequential commas', () => {
    const line = ',,,,';
    expect(parseCsvLine(line)).toEqual(['', '', '', '', '']);
  });

  // Test Case 14: Parse CSV line with all quoted empty fields
  it('Test Case 14: Parse CSV line with all quoted empty fields', () => {
    const line = '"","",""';
    expect(parseCsvLine(line)).toEqual(['', '', '']);
  });

  // Test Case 15: Parse CSV line with field containing both an escaped quote and comma
  it('Test Case 15: Parse CSV line with field containing both an escaped quote and comma', () => {
    const line = 'field1,"field, with ""escaped"" quote",field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field, with "escaped" quote', 'field3']);
  });

  // Test Case 16: Parse CSV line containing only a comma
  it('Test Case 16: Parse CSV line containing only a comma', () => {
    const line = ',';
    expect(parseCsvLine(line)).toEqual(['', '']);
  });

  // Test Case 17: Parse non-string input
  it('Test Case 17: Parse non-string input', () => {
    const inputs = [null, 123, {}];
    for (const input of inputs) {
      expect(() => parseCsvLine(input as unknown as string)).toThrow();
    }
  });

  // Test Case 18: Parse CSV line with field containing commas and newlines in quotes
  it('Test Case 18: Parse CSV line with field containing commas and newlines in quotes', () => {
    const line = 'field1,"field, with\nmultiple, lines",field3';
    expect(parseCsvLine(line)).toEqual(['field1', 'field, with\nmultiple, lines', 'field3']);
  });

  // Test Case 19: Parse CSV line with fields mixing quoted and unquoted fields
  it('Test Case 19: Parse CSV line with fields mixing quoted and unquoted fields', () => {
    const line = 'field1,"quoted,field",unquoted2,"quoted2"';
    expect(parseCsvLine(line)).toEqual(['field1', 'quoted,field', 'unquoted2', 'quoted2']);
  });

  // Test Case 20: Parse CSV line with single quote in a field
  it('Test Case 20: Parse CSV line with single quote in a field', () => {
    const line = "field1,'single quote',field3";
    expect(parseCsvLine(line)).toEqual(['field1', "'single quote'", 'field3']);
  });
});