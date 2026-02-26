import { parseCsvLine } from '../../src/server';

describe('parseCsvLine', () => {
  // Test Case 1: Parse simple comma separated values
  it('Test Case 1: Parse simple comma separated values', () => {
    const line = 'id,name,username,email';
    expect(parseCsvLine(line)).toEqual(['id', 'name', 'username', 'email']);
  });

  // Test Case 2: Parse fields with quoted values containing commas
  it('Test Case 2: Parse fields with quoted values containing commas', () => {
    const line = '"Doe, John",username,john@example.com';
    expect(parseCsvLine(line)).toEqual(['Doe, John', 'username', 'john@example.com']);
  });

  // Test Case 3: Parse quoted fields with escaped quotes
  it('Test Case 3: Parse quoted fields with escaped quotes', () => {
    const line = '"John ""Johnny"" Doe",user1,user1@example.com';
    expect(parseCsvLine(line)).toEqual(['John "Johnny" Doe', 'user1', 'user1@example.com']);
  });

  // Test Case 4: Fields with leading and trailing spaces
  it('Test Case 4: Fields with leading and trailing spaces', () => {
    const line = '  id  ,  name  ,  email  ';
    expect(parseCsvLine(line)).toEqual(['  id  ', '  name  ', '  email  ']);
  });

  // Test Case 5: Handle empty fields
  it('Test Case 5: Handle empty fields', () => {
    const line = 'id,,username,,email';
    expect(parseCsvLine(line)).toEqual(['id', '', 'username', '', 'email']);
  });

  // Test Case 6: Field with only quotes
  it('Test Case 6: Field with only quotes', () => {
    const line = '""""';
    expect(parseCsvLine(line)).toEqual(['"']);
  });

  // Test Case 7: Line ending with a comma
  it('Test Case 7: Line ending with a comma', () => {
    const line = 'id,name,';
    expect(parseCsvLine(line)).toEqual(['id', 'name', '']);
  });

  // Test Case 8: Line starting with a comma
  it('Test Case 8: Line starting with a comma', () => {
    const line = ',name,email';
    expect(parseCsvLine(line)).toEqual(['', 'name', 'email']);
  });

  // Test Case 9: All fields are quoted
  it('Test Case 9: All fields are quoted', () => {
    const line = '"id","name","email"';
    expect(parseCsvLine(line)).toEqual(['id', 'name', 'email']);
  });

  // Test Case 10: Field with a newline within quotes
  it('Test Case 10: Field with a newline within quotes', () => {
    const line = '"John\nDoe",email';
    expect(parseCsvLine(line)).toEqual(['John\nDoe', 'email']);
  });

  // Test Case 11: Unclosed quoted field
  it('Test Case 11: Unclosed quoted field', () => {
    const line = '"John,Doe,email';
    expect(parseCsvLine(line)).toEqual(['John,Doe,email']);
  });

  // Test Case 12: Malformed escaped quote
  it('Test Case 12: Malformed escaped quote', () => {
    const line = '"John "Doe"",email';
    expect(parseCsvLine(line)).toEqual(['John "Doe"', 'email']);
  });

  // Test Case 13: Empty line input
  it('Test Case 13: Empty line input', () => {
    const line = '';
    expect(parseCsvLine(line)).toEqual(['']);
  });

  // Test Case 14: Line with only commas
  it('Test Case 14: Line with only commas', () => {
    const line = ',,,';
    expect(parseCsvLine(line)).toEqual(['', '', '', '']);
  });

  // Test Case 15: Mixed quoted and unquoted fields
  it('Test Case 15: Mixed quoted and unquoted fields', () => {
    const line = '"Doe, John",username,email';
    expect(parseCsvLine(line)).toEqual(['Doe, John', 'username', 'email']);
  });

  // Test Case 16: Quoted field with both comma and quote
  it('Test Case 16: Quoted field with both comma and quote', () => {
    const line = '"Smith, ""The Hammer""",user2';
    expect(parseCsvLine(line)).toEqual(['Smith, "The Hammer"', 'user2']);
  });
});