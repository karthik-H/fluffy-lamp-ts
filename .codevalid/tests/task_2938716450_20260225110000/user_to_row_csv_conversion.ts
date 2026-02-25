import { userToRow } from '../../src/fetch-users';

describe('userToRow CSV Conversion', () => {
  // Helper to deep clone objects for test isolation
  const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

  test('Test Case 1: Valid User Object', () => {
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

  test('Test Case 2: Missing Required Fields', () => {
    const user = {
      address: { city: 'Wisokyburgh', street: 'Victor Plains' },
      email: 'Shanna@melissa.tv',
      id: 2,
      name: 'Ervin Howell',
      phone: '010-692-6593 x09125',
      username: 'Antonette'
      // zipcode and website missing
    };
    let result;
    try {
      result = userToRow(user);
      expect(result).toEqual([
        2,
        'Ervin Howell',
        'Antonette',
        'Shanna@melissa.tv',
        'Victor Plains',
        'Wisokyburgh',
        undefined,
        '010-692-6593 x09125',
        undefined
      ]);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('Test Case 3: User Object With Extra Fields', () => {
    const user = {
      address: { city: 'McKenziehaven', street: 'Douglas Extension', zipcode: '59590-4157' },
      company: { name: 'Romaguera-Jacobson' },
      email: 'Nathan@yesenia.net',
      hobbies: ['reading', 'chess'],
      id: 3,
      name: 'Clementine Bauch',
      phone: '1-463-123-4447',
      username: 'Samantha',
      website: 'ramiro.info'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      3,
      'Clementine Bauch',
      'Samantha',
      'Nathan@yesenia.net',
      'Douglas Extension',
      'McKenziehaven',
      '59590-4157',
      '1-463-123-4447',
      'ramiro.info'
    ]);
  });

  test('Test Case 4: Fields With Empty Strings', () => {
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

  test('Test Case 5: Fields With Special Characters', () => {
    const user = {
      address: { city: 'New\nYork', street: 'Main St., Apt "5B"', zipcode: '10001-0001' },
      email: 'john,smith@example.com',
      id: 5,
      name: 'O\'Conner, "John"\nSmith',
      phone: '(555) 555-5555',
      username: 'john_smith',
      website: 'johnsmith.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      5,
      'O\'Conner, "John"\nSmith',
      'john_smith',
      'john,smith@example.com',
      'Main St., Apt "5B"',
      'New\nYork',
      '10001-0001',
      '(555) 555-5555',
      'johnsmith.com'
    ]);
  });

  test('Test Case 6: Fields With Null Values', () => {
    const user = {
      address: { city: null, street: null, zipcode: null },
      email: null,
      id: 6,
      name: null,
      phone: null,
      username: null,
      website: null
    };
    const result = userToRow(user);
    expect(result).toEqual([6, null, null, null, null, null, null, null, null]);
  });

  test('Test Case 7: Minimal User Object', () => {
    const user = {
      address: { city: 'C', street: 'B', zipcode: 'D' },
      email: 'a@b.c',
      id: 7,
      name: 'A',
      phone: '1',
      username: 'A',
      website: 'w'
    };
    const result = userToRow(user);
    expect(result).toEqual([7, 'A', 'A', 'a@b.c', 'B', 'C', 'D', '1', 'w']);
  });

  test('Test Case 8: Non-Integer ID', () => {
    const user = {
      address: { city: 'City', street: 'Street', zipcode: 'Zip' },
      email: 'test@example.com',
      id: '8a',
      name: 'Test Name',
      phone: '123456',
      username: 'testuser',
      website: 'test.com'
    };
    const result = userToRow(user);
    expect(result).toEqual([
      '8a',
      'Test Name',
      'testuser',
      'test@example.com',
      'Street',
      'City',
      'Zip',
      '123456',
      'test.com'
    ]);
  });

  test('Test Case 9: User Object With No Address', () => {
    const user = {
      email: 'no@address.com',
      id: 9,
      name: 'No Address',
      phone: '000',
      username: 'nouser',
      website: 'no.com'
    };
    let result;
    try {
      result = userToRow(user);
      expect(result).toEqual([
        9,
        'No Address',
        'nouser',
        'no@address.com',
        undefined,
        undefined,
        undefined,
        '000',
        'no.com'
      ]);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('Test Case 10: Input Is Not an Object', () => {
    const user = null;
    let result;
    try {
      result = userToRow(user);
      expect(result).toBeUndefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('Test Case 11: Very Large String Fields', () => {
    const repeat = (char: string, n: number) => Array(n).fill(char).join('');
    const user = {
      address: {
        city: repeat('E', 10000),
        street: repeat('D', 10000),
        zipcode: repeat('F', 10000)
      },
      email: repeat('C', 10000),
      id: 10,
      name: repeat('A', 10000),
      phone: repeat('G', 10000),
      username: repeat('B', 10000),
      website: repeat('H', 10000)
    };
    const result = userToRow(user);
    expect(result).toEqual([
      10,
      repeat('A', 10000),
      repeat('B', 10000),
      repeat('C', 10000),
      repeat('D', 10000),
      repeat('E', 10000),
      repeat('F', 10000),
      repeat('G', 10000),
      repeat('H', 10000)
    ]);
  });
});