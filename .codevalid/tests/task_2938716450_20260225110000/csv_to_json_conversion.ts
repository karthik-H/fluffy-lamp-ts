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
  test('Valid CSV with Simple Header and Rows', () => {
    const csv = 'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'John Doe' },
      { email: 'jane@example.com', id: '2', name: 'Jane Smith' }
    ]);
  });

  test('CSV With Only Header Line', () => {
    const csv = 'id,name,email';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('Empty CSV String', () => {
    const csv = '';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV With Blank Lines', () => {
    const csv = '\nid,name,email\n\n1,John Doe,john@example.com\n\n2,Jane Smith,jane@example.com\n\n';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'John Doe' },
      { email: 'jane@example.com', id: '2', name: 'Jane Smith' }
    ]);
  });

  test('CSV With Missing Field Value', () => {
    const csv = 'id,name,email\n1,John Doe,\n2,Jane Smith,jane@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: '', id: '1', name: 'John Doe' },
      { email: 'jane@example.com', id: '2', name: 'Jane Smith' }
    ]);
  });

  test('CSV With Extra Field Value', () => {
    const csv = 'id,name\n1,John Doe,unexpected\n2,Jane Smith';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ]);
  });

  test('CSV With Quoted Fields and Commas', () => {
    const csv = 'id,name,email\n1,"Doe, John","john@example.com"\n2,"Smith\nJane","jane@example.com"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'Doe, John' },
      { email: 'jane@example.com', id: '2', name: 'Smith\nJane' }
    ]);
  });

  test('Malformed CSV Input', () => {
    const csv = 'id,name,email\n1,John Doe\n2,Jane Smith,jane@example.com,extra';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: '', id: '1', name: 'John Doe' },
      { email: 'jane@example.com', id: '2', name: 'Jane Smith' }
    ]);
  });

  test('Non-String Input', () => {
    const csv: any = null;
    const result = safeCsvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV With Numeric Fields', () => {
    const csv = 'id,age\n1,25\n2,30';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { age: '25', id: '1' },
      { age: '30', id: '2' }
    ]);
  });

  test('CSV With Whitespace In Header', () => {
    const csv = ' id , name , email \n1,John Doe,john@example.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john@example.com', id: '1', name: 'John Doe' }
    ]);
  });

  test('CSV With Only Newlines', () => {
    const csv = '\n\n\n';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });
});