import { userToRow } from '../../src/fetch-users';

describe('userToRow CSV Conversion', () => {
  // Helper to deep clone objects for test isolation
  const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

  test('Test Case 1: Convert typical user object to CSV row', () => {
    const user = {
      address: { city: 'Gwenborough', street: 'Kulas Light', zipcode: '92998-3874' },
      email: 'Sincere@april.biz',
      id: 1,
      name: 'Leanne Graham',
      phone: '1-770-736-8031 x56442',
      username: 'Bret',
      website: 'hildegard.org'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      1,
      'Leanne Graham',
      'Bret',
      'Sincere@april.biz',
      'Kulas Light',
      'Gwenborough',
      '92998-3874',
      '1-770-736-8031 x56442',
      'hildegard.org'
    ]);
  });

  test('Test Case 2: User fields with CSV special characters', () => {
    const user = {
      address: { city: 'New\nCity', street: '123 "Fake" Ave., Apt. 5', zipcode: '12345' },
      email: 'john,oconnor@example.com',
      id: 2,
      name: 'John "Johnny, Jr."\nO\'Connor',
      phone: '123-456-7890',
      username: 'j.oconnor',
      website: 'johnny.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      2,
      'John "Johnny, Jr."\nO\'Connor',
      'j.oconnor',
      'john,oconnor@example.com',
      '123 "Fake" Ave., Apt. 5',
      'New\nCity',
      '12345',
      '123-456-7890',
      'johnny.com'
    ]);
  });

  test('Test Case 3: User object with missing optional fields', () => {
    const user = {
      address: { city: 'Metropolis', street: 'Main St', zipcode: '00000' },
      email: 'jane@example.com',
      id: 3,
      name: 'Jane Doe',
      username: 'jane'
      // phone and website missing
    };
    const result = userToRow(user);
    expect(result).toEqual([
      3,
      'Jane Doe',
      'jane',
      'jane@example.com',
      'Main St',
      'Metropolis',
      '00000',
      '',
      ''
    ]);
  });

  test('Test Case 4: User fields with empty strings', () => {
    const user = {
      address: { city: '', street: '', zipcode: '' },
      email: '',
      id: 4,
      name: '',
      phone: '',
      username: '',
      website: ''
    };
    const result = userToRow(user);
    expect(result).toEqual([4, '', '', '', '', '', '', '', '']);
  });

  test('Test Case 5: User fields are null', () => {
    const user = {
      address: { city: null, street: null, zipcode: null },
      email: null,
      id: 5,
      name: null,
      phone: null,
      username: null,
      website: null
    };
    const result = userToRow(user);
    expect(result).toEqual([5, '', '', '', '', '', '', '', '']);
  });

  test('Test Case 6: User object missing address field', () => {
    const user = {
      email: 'noaddr@example.com',
      id: 6,
      name: 'No Address',
      phone: '555-0000',
      username: 'noaddr',
      website: 'noaddr.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      6,
      'No Address',
      'noaddr',
      'noaddr@example.com',
      '',
      '',
      '',
      '555-0000',
      'noaddr.com'
    ]);
  });

  test('Test Case 7: User fields with invalid types', () => {
    const user = {
      address: { city: { object: 'city' }, street: ['Not', 'a', 'string'], zipcode: false },
      email: null,
      id: 7,
      name: 12345,
      phone: 0,
      username: true,
      website: null
    };
    const result = userToRow(user);
    expect(result).toEqual([
      7,
      '12345',
      'true',
      '',
      'Not,a,string',
      '[object Object]',
      'false',
      '0',
      ''
    ]);
  });

  test('Test Case 8: User object is null', () => {
    const user = null;
    expect(() => userToRow(user)).toThrow();
  });

  test('Test Case 9: User object is undefined', () => {
    let user: any = undefined;
    expect(() => userToRow(user)).toThrow();
  });

  test('Test Case 10: User object missing \'id\' field', () => {
    const user = {
      address: { city: 'Testville', street: 'Test', zipcode: '00001' },
      email: 'noid@example.com',
      name: 'Missing ID',
      phone: '555-1111',
      username: 'noid',
      website: 'noid.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      '',
      'Missing ID',
      'noid',
      'noid@example.com',
      'Test',
      'Testville',
      '00001',
      '555-1111',
      'noid.com'
    ]);
  });
});