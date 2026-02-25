import { csvToJson } from '../../src/server';

// Helper to handle expected errors or empty array for invalid input
function safeCsvToJson(input: any): any[] {
  try {
    return csvToJson(input);
  } catch (e) {
    return [];
  }
}

describe('csvToJson(csv)', () => {
  test('Minimal valid CSV input', () => {
    const csv = 'id,name,email\n1,John Doe,john@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'John Doe' }
    ]);
  });

  test('CSV with multiple rows', () => {
    const csv = 'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'John Doe' },
      { email: 'jane@example.com', id: '2', name: 'Jane Smith' }
    ]);
  });

  test('CSV with header only', () => {
    const csv = 'id,name,email';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('Empty CSV string', () => {
    const csv = '';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV with only newline', () => {
    const csv = '\n';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV with trailing newlines', () => {
    const csv = 'id,name\n1,Alice\n2,Bob\n\n';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ]);
  });

  test('Row missing a field', () => {
    const csv = 'id,name,email\n1,John Doe';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: '', id: '1', name: 'John Doe' }
    ]);
  });

  test('Row with extra field', () => {
    const csv = 'id,name\n1,John Doe,extra_field';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'John Doe' }
    ]);
  });

  test('CSV with quoted fields containing commas', () => {
    const csv = 'id,name,notes\n1,"John, Jr.","Likes apples, oranges"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'John, Jr.', notes: 'Likes apples, oranges' }
    ]);
  });

  test('CSV with quoted fields containing newlines', () => {
    const csv = 'id,notes\n1,"First line\nSecond line"\n2,"Another\nmulti-line"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', notes: 'First line\nSecond line' },
      { id: '2', notes: 'Another\nmulti-line' }
    ]);
  });

  test('CSV with extra whitespace around headers and values', () => {
    const csv = ' id , name \n 1 , Alice ';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'Alice' }
    ]);
  });

  test('CSV with no header and only data', () => {
    const csv = '1,John Doe,john@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV with headers containing special characters', () => {
    const csv = 'user-id,user_name,email2\n1,alice,alice@mail.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { 'user-id': '1', user_name: 'alice', email2: 'alice@mail.com' }
    ]);
  });

  test('CSV with blank lines between rows', () => {
    const csv = 'id,name\n1,Alice\n\n2,Bob';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ]);
  });

  test('CSV with all fields empty', () => {
    const csv = 'id,name,email\n,,\n,,\n';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '', name: '', email: '' },
      { id: '', name: '', email: '' }
    ]);
  });

  test('CSV with escaped quote in field', () => {
    const csv = 'id,comment\n1,"He said ""hello"" to me"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', comment: 'He said "hello" to me' }
    ]);
  });

  test('Malformed CSV with unclosed quoted field', () => {
    const csv = 'id,comment\n1,"Unclosed quote';
    const result = safeCsvToJson(csv);
    expect(result).toEqual([]);
  });

  test('Non-string input', () => {
    const csv: any = null;
    const result = safeCsvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV with Unicode characters', () => {
    const csv = 'id,name\n1,李雷\n2,Мария';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: '李雷' },
      { id: '2', name: 'Мария' }
    ]);
  });

  test('CSV with headers that include spaces', () => {
    const csv = 'user id,full name\n1,John Smith';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { 'user id': '1', 'full name': 'John Smith' }
    ]);
  });
});