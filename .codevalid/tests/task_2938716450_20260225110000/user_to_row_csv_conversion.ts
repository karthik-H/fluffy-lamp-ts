import { userToRow } from '../../src/fetch-users';

describe('userToRow CSV Conversion', () => {
  // Helper to deep clone objects for test isolation
  const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

  test('Test Case 1: Valid user with all fields present', () => {
    const user = {
      address: { city: 'Springfield', street: '123 Main St', zipcode: '12345' },
      email: 'john@example.com',
      id: 1,
      name: 'John Doe',
      phone: '555-1234',
      username: 'johndoe',
      website: 'johndoe.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([1, 'John Doe', 'johndoe', 'john@example.com', '123 Main St', 'Springfield', '12345', '555-1234', 'johndoe.com']);
  });

  test('Test Case 2: User fields contain commas', () => {
    const user = {
      address: { city: 'New York', street: '456 Elm St, Apt 2', zipcode: '10001' },
      email: 'jane,smith@example.com',
      id: 2,
      name: 'Jane, Smith',
      phone: '555-5678',
      username: 'jane,smith',
      website: 'janesmith.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      2,
      '"Jane, Smith"',
      '"jane,smith"',
      '"jane,smith@example.com"',
      '"456 Elm St, Apt 2"',
      'New York',
      '10001',
      '555-5678',
      'janesmith.com'
    ]);
  });

  test('Test Case 3: User fields contain quotes', () => {
    const user = {
      address: { city: 'Quoteville', street: '789 Oak St', zipcode: '22222' },
      email: 'alice"ace"@example.com',
      id: 3,
      name: 'Alice "The Ace" Doe',
      phone: '555-9999',
      username: 'alice"ace"',
      website: 'aliceace.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      3,
      '"Alice ""The Ace"" Doe"',
      '"alice""ace"""',
      '"alice""ace""@example.com"',
      '789 Oak St',
      'Quoteville',
      '22222',
      '555-9999',
      'aliceace.com'
    ]);
  });

  test('Test Case 4: Missing address field', () => {
    const user = {
      email: 'bob@example.com',
      id: 4,
      name: 'Bob',
      phone: '555-0000',
      username: 'bobby',
      website: 'bob.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([4, 'Bob', 'bobby', 'bob@example.com', '', '', '', '555-0000', 'bob.com']);
  });

  test('Test Case 5: Missing phone and website fields', () => {
    const user = {
      address: { city: 'Silicon Valley', street: '1 Hacker Way', zipcode: '94043' },
      email: 'eve@example.com',
      id: 5,
      name: 'Eve',
      username: 'eve'
    };
    const result = userToRow(user);
    expect(result).toEqual([5, 'Eve', 'eve', 'eve@example.com', '1 Hacker Way', 'Silicon Valley', '94043', '', '']);
  });

  test('Test Case 6: User id is zero', () => {
    const user = {
      address: { city: 'Nowhere', street: 'Zero St', zipcode: '00000' },
      email: 'zero@example.com',
      id: 0,
      name: 'Zero',
      phone: '000-0000',
      username: 'zero',
      website: 'zero.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([0, 'Zero', 'zero', 'zero@example.com', 'Zero St', 'Nowhere', '00000', '000-0000', 'zero.com']);
  });

  test('Test Case 7: Missing id field', () => {
    const user = {
      address: { city: 'Void', street: 'No ID St', zipcode: '99999' },
      email: 'noid@example.com',
      name: 'NoID',
      phone: '999-9999',
      username: 'noid',
      website: 'noid.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([null, 'NoID', 'noid', 'noid@example.com', 'No ID St', 'Void', '99999', '999-9999', 'noid.com']);
  });

  test('Test Case 8: Fields with empty strings', () => {
    const user = {
      address: { city: '', street: '', zipcode: '' },
      email: '',
      id: 6,
      name: '',
      phone: '',
      username: '',
      website: ''
    };
    const result = userToRow(user);
    expect(result).toEqual([6, '', '', '', '', '', '', '', '']);
  });

  test('Test Case 9: Fields with null values', () => {
    const user = {
      address: { city: null, street: null, zipcode: null },
      email: null,
      id: null,
      name: null,
      phone: null,
      username: null,
      website: null
    };
    const result = userToRow(user);
    expect(result).toEqual([null, '', '', '', '', '', '', '', '']);
  });

  test('Test Case 10: Fields with non-string types', () => {
    const user = {
      address: { city: true, street: 999, zipcode: false },
      email: false,
      id: 7,
      name: 12345,
      phone: 5551234,
      username: true,
      website: null
    };
    const result = userToRow(user);
    expect(result).toEqual([7, '12345', 'true', 'false', '999', 'true', 'false', '5551234', '']);
  });

  test('Test Case 11: User object with only id field', () => {
    const user = { id: 8 };
    const result = userToRow(user);
    expect(result).toEqual([8, '', '', '', '', '', '', '', '']);
  });

  test('Test Case 12: User object contains additional unexpected fields', () => {
    const user = {
      address: { city: 'Extratown', street: 'Extra St', zipcode: '88888' },
      company: 'ExtraCorp',
      email: 'extra@example.com',
      hobbies: ['reading', 'coding'],
      id: 9,
      name: 'Extra Fields',
      phone: '555-8888',
      username: 'extra',
      website: 'extra.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([9, 'Extra Fields', 'extra', 'extra@example.com', 'Extra St', 'Extratown', '88888', '555-8888', 'extra.com']);
  });
});