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
  test('Converts standard CSV to JSON', () => {
    const csv = 'id,name,username,email\n1,Leanne Graham,Bret,Sincere@april.biz\n2,Ervin Howell,Antonette,Shanna@melissa.tv';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'Sincere@april.biz', id: '1', name: 'Leanne Graham', username: 'Bret' },
      { email: 'Shanna@melissa.tv', id: '2', name: 'Ervin Howell', username: 'Antonette' }
    ]);
  });

  test('CSV with header only returns empty array', () => {
    const csv = 'id,name,username,email';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('Empty CSV string returns empty array', () => {
    const csv = '';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV with only whitespace returns empty array', () => {
    const csv = '    \n   ';
    const result = csvToJson(csv);
    expect(result).toEqual([]);
  });

  test('CSV fields with internal commas and quotes are parsed correctly', () => {
    const csv = 'id,name,username,email\n3,"Smith, John","johnny,smith","john,smith@email.com"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'john,smith@email.com', id: '3', name: 'Smith, John', username: 'johnny,smith' }
    ]);
  });

  test('CSV with missing fields in a row', () => {
    const csv = 'id,name,username,email\n4,Jane Doe,janedoe';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: '', id: '4', name: 'Jane Doe', username: 'janedoe' }
    ]);
  });

  test('CSV with extra fields in a row', () => {
    const csv = 'id,name,username\n5,Sam Smith,samsmith,extra_field';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { id: '5', name: 'Sam Smith', username: 'samsmith' }
    ]);
  });

  test('Passing null as CSV input', () => {
    // Depending on implementation, may throw TypeError or return []
    let threw = false;
    let result: any[] = [];
    try {
      result = csvToJson(null as any);
    } catch (e) {
      threw = true;
    }
    expect(threw || Array.isArray(result) && result.length === 0).toBe(true);
  });

  test('CSV with blank lines between rows', () => {
    const csv = 'id,name,username,email\n\n6,Ann,ann99,ann@email.com\n\n7,Bob,bobby,bob@email.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'ann@email.com', id: '6', name: 'Ann', username: 'ann99' },
      { email: 'bob@email.com', id: '7', name: 'Bob', username: 'bobby' }
    ]);
  });

  test('CSV field contains newline within quoted value', () => {
    const csv = 'id,name,username,email\n8,"Alice\nWonder","alicew","alice@wonder.com"';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'alice@wonder.com', id: '8', name: 'Alice\nWonder', username: 'alicew' }
    ]);
  });

  test('CSV with duplicate header fields', () => {
    const csv = 'id,name,name,email\n9,John,Johnny,johnny@email.com';
    const result = csvToJson(csv);
    // Only last duplicate header should be used for 'name'
    expect(result).toEqual([
      { email: 'johnny@email.com', id: '9', name: 'Johnny' }
    ]);
  });

  test('Non-string input (number) returns error or empty array', () => {
    let threw = false;
    let result: any[] = [];
    try {
      result = csvToJson(12345 as any);
    } catch (e) {
      threw = true;
    }
    expect(threw || Array.isArray(result) && result.length === 0).toBe(true);
  });

  test('CSV header with leading/trailing spaces is trimmed', () => {
    const csv = ' id , name , username , email \n10, Spacey,spacey,spacey@email.com';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'spacey@email.com', id: '10', name: 'Spacey', username: 'spacey' }
    ]);
  });

  test('CSV with trailing newlines', () => {
    const csv = 'id,name,username,email\n11,Last,lastname,last@email.com\n\n\n';
    const result = csvToJson(csv);
    expect(result).toEqual([
      { email: 'last@email.com', id: '11', name: 'Last', username: 'lastname' }
    ]);
  });
});