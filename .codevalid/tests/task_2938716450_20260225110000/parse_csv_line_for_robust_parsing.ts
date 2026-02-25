import { parseCsvLine } from '../../src/server';

describe('parseCsvLine', () => {
  // Test Case 1: Parse simple CSV with unquoted fields
  it('Test Case 1: Parse simple CSV with unquoted fields', () => {
    const line = '1,John Doe,jdoe@example.com';
    expect(parseCsvLine(line)).toEqual(['1', 'John Doe', 'jdoe@example.com']);
  });

  // Test Case 2: Parse CSV with quoted fields containing commas
  it('Test Case 2: Parse CSV with quoted fields containing commas', () => {
    const line = '1,"Doe, John",jdoe@example.com';
    expect(parseCsvLine(line)).toEqual(['1', 'Doe, John', 'jdoe@example.com']);
  });

  // Test Case 3: Parse CSV with fields containing escaped quotes
  it('Test Case 3: Parse CSV with fields containing escaped quotes', () => {
    const line = '2,"Jane ""JJ"" Doe",jane@example.com';
    expect(parseCsvLine(line)).toEqual(['2', 'Jane "JJ" Doe', 'jane@example.com']);
  });

  // Test Case 4: Parse CSV line with trailing comma
  it('Test Case 4: Parse CSV line with trailing comma', () => {
    const line = '3,James Smith,';
    expect(parseCsvLine(line)).toEqual(['3', 'James Smith', '']);
  });

  // Test Case 5: Parse CSV line with leading comma
  it('Test Case 5: Parse CSV line with leading comma', () => {
    const line = ',First Field,Second Field';
    expect(parseCsvLine(line)).toEqual(['', 'First Field', 'Second Field']);
  });

  // Test Case 6: Parse CSV line with multiple adjacent commas
  it('Test Case 6: Parse CSV line with multiple adjacent commas', () => {
    const line = 'one,,three,,,six';
    expect(parseCsvLine(line)).toEqual(['one', '', 'three', '', '', 'six']);
  });

  // Test Case 7: Parse line consisting of only quotes
  it('Test Case 7: Parse line consisting of only quotes', () => {
    const line = '""';
    expect(parseCsvLine(line)).toEqual(['']);
  });

  // Test Case 8: Parse empty line
  it('Test Case 8: Parse empty line', () => {
    const line = '';
    expect(parseCsvLine(line)).toEqual(['']);
  });

  // Test Case 9: Parse fields containing only whitespace
  it('Test Case 9: Parse fields containing only whitespace', () => {
    const line = '  ,\t,\n ,"  ",field';
    expect(parseCsvLine(line)).toEqual(['  ', '\t', '\n ', '  ', 'field']);
  });

  // Test Case 10: Parse CSV with unclosed quoted field
  it('Test Case 10: Parse CSV with unclosed quoted field', () => {
    const line = '4,"Unclosed field,still quoted,jdoe@example.com';
    expect(parseCsvLine(line)).toEqual(['4', 'Unclosed field,still quoted,jdoe@example.com']);
  });

  // Test Case 11: Parse line with only one field
  it('Test Case 11: Parse line with only one field', () => {
    const line = 'singlefield';
    expect(parseCsvLine(line)).toEqual(['singlefield']);
  });

  // Test Case 12: Parse quoted field containing a newline character
  it('Test Case 12: Parse quoted field containing a newline character', () => {
    const line = '5,"Line with\nnewline",another';
    expect(parseCsvLine(line)).toEqual(['5', 'Line with\nnewline', 'another']);
  });

  // Test Case 13: Parse quoted empty field
  it('Test Case 13: Parse quoted empty field', () => {
    const line = '6,"",email@example.com';
    expect(parseCsvLine(line)).toEqual(['6', '', 'email@example.com']);
  });

  // Test Case 14: Field with both comma and escaped quote
  it('Test Case 14: Field with both comma and escaped quote', () => {
    const line = '7,"Value, with ""quote"" inside",test';
    expect(parseCsvLine(line)).toEqual(['7', 'Value, with "quote" inside', 'test']);
  });

  // Test Case 15: Parse line with only commas
  it('Test Case 15: Parse line with only commas', () => {
    const line = ',,,';
    expect(parseCsvLine(line)).toEqual(['', '', '', '']);
  });

  // Test Case 16: Parse null as input
  it('Test Case 16: Parse null as input', () => {
    expect(() => parseCsvLine(null as unknown as string)).toThrow(TypeError);
  });
});