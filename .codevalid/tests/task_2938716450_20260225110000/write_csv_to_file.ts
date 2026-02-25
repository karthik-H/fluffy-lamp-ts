import fs from 'fs';
import path from 'path';
import { writeFileSync } from '../../src/fetch-users';

jest.mock('fs');

const CSV_PATH = path.join(__dirname, 'test_users.csv');
const CSV_PATH_INVALID = path.join(__dirname, 'nonexistent_dir', 'test_users.csv');
const CSV_PATH_NO_PERMISSION = '/root/test_users.csv';
const CSV_PATH_READONLY = path.join(__dirname, 'readonly_users.csv');
const CSV_PATH_DIR = __dirname;
const CSV_PATH_UNWRITABLE_DIR = '/root/unwritable_dir/test_users.csv';

describe('writeFileSync', () => {
  afterEach(() => {
    jest.clearAllMocks();
    if (fs.existsSync(CSV_PATH)) {
      fs.unlinkSync(CSV_PATH);
    }
    if (fs.existsSync(CSV_PATH_READONLY)) {
      fs.unlinkSync(CSV_PATH_READONLY);
    }
  });

  // Test Case 1: Write CSV file for standard user data
  test('Write CSV file for standard user data', () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      username: `user${i + 1}`,
      phone: `555-000${i + 1}`,
      website: `user${i + 1}.com`,
      address: {
        street: `Street ${i + 1}`,
        suite: `Suite ${i + 1}`,
        city: `City ${i + 1}`,
        zipcode: `0000${i + 1}`,
      },
      company: {
        name: `Company ${i + 1}`,
        catchPhrase: `CatchPhrase ${i + 1}`,
        bs: `BS ${i + 1}`,
      },
    }));

    // Flatten users for CSV
    const headers = [
      'id', 'name', 'email', 'username', 'phone', 'website',
      'address.street', 'address.suite', 'address.city', 'address.zipcode',
      'company.name', 'company.catchPhrase', 'company.bs'
    ];
    const rows = users.map(u =>
      [
        u.id, u.name, u.email, u.username, u.phone, u.website,
        u.address.street, u.address.suite, u.address.city, u.address.zipcode,
        u.company.name, u.company.catchPhrase, u.company.bs
      ].join(',')
    );
    const csv = `${headers.join(',')}\n${rows.join('\n')}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
    expect(fs.__mockFileContent.split('\n').length).toBe(11); // 1 header + 10 rows
  });

  // Test Case 2: Overwrite existing CSV file
  test('Overwrite existing CSV file', () => {
    const oldContent = 'id,name,email\n1,OldUser,old@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = oldContent;
    });
    fs.writeFileSync(CSV_PATH, oldContent, { encoding: 'utf8' });

    const newCsv = 'id,name,email\n2,NewUser,new@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = newCsv;
    });

    writeFileSync(newCsv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, newCsv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(newCsv);
    expect(fs.__mockFileContent).not.toContain('OldUser');
  });

  // Test Case 3: Do not write file for empty CSV string
  test('Do not write file for empty CSV string', () => {
    const csv = '';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Empty or invalid CSV string');
    });

    expect(() => writeFileSync(csv, CSV_PATH)).toThrow('Empty or invalid CSV string');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  // Test Case 4: Do not create file on API fetch failure
  test('Do not create file on API fetch failure', () => {
    // Simulate API fetch failure by not generating CSV and not calling writeFileSync
    // No CSV string, so writeFileSync should not be called
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  // Test Case 5: Write CSV file for single user object
  test('Write CSV file for single user object', () => {
    const user = {
      id: 1,
      name: 'User1',
      email: 'user1@example.com',
      username: 'user1',
      phone: '555-0001',
      website: 'user1.com',
      address: {
        street: 'Street 1',
        suite: 'Suite 1',
        city: 'City 1',
        zipcode: '00001',
      },
      company: {
        name: 'Company 1',
        catchPhrase: 'CatchPhrase 1',
        bs: 'BS 1',
      },
    };
    const headers = [
      'id', 'name', 'email', 'username', 'phone', 'website',
      'address.street', 'address.suite', 'address.city', 'address.zipcode',
      'company.name', 'company.catchPhrase', 'company.bs'
    ];
    const row = [
      user.id, user.name, user.email, user.username, user.phone, user.website,
      user.address.street, user.address.suite, user.address.city, user.address.zipcode,
      user.company.name, user.company.catchPhrase, user.company.bs
    ].join(',');
    const csv = `${headers.join(',')}\n${row}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
    expect(fs.__mockFileContent.split('\n').length).toBe(2); // 1 header + 1 row
  });

  // Test Case 6: Write CSV file with nested user fields flattened
  test('Write CSV file with nested user fields flattened', () => {
    const user = {
      id: 1,
      name: 'User1',
      email: 'user1@example.com',
      username: 'user1',
      phone: '555-0001',
      website: 'user1.com',
      address: {
        street: 'Street 1',
        suite: 'Suite 1',
        city: 'City 1',
        zipcode: '00001',
      },
      company: {
        name: 'Company 1',
        catchPhrase: 'CatchPhrase 1',
        bs: 'BS 1',
      },
    };
    const headers = [
      'id', 'name', 'email', 'username', 'phone', 'website',
      'address.street', 'address.suite', 'address.city', 'address.zipcode',
      'company.name', 'company.catchPhrase', 'company.bs'
    ];
    const row = [
      user.id, user.name, user.email, user.username, user.phone, user.website,
      user.address.street, user.address.suite, user.address.city, user.address.zipcode,
      user.company.name, user.company.catchPhrase, user.company.bs
    ].join(',');
    const csv = `${headers.join(',')}\n${row}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
    expect(fs.__mockFileContent).toContain('address.street');
    expect(fs.__mockFileContent).toContain('company.name');
  });

  // Test Case 7: Write CSV with non-ASCII characters
  test('Write CSV with non-ASCII characters', () => {
    const csv = 'id,name,email\n1,José Álvarez,user1@example.com\n2,李雷,user2@example.com\n3,User😊,user3@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toContain('José Álvarez');
    expect(fs.__mockFileContent).toContain('李雷');
    expect(fs.__mockFileContent).toContain('User😊');
  });

  // Test Case 8: Write CSV file for large number of users
  test('Write CSV file for large number of users', () => {
    const users = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(u => Object.values(u).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent.length).toBe(csv.length);
    expect(fs.__mockFileContent.split('\n').length).toBe(10001); // 1 header + 10000 rows
  });

  // Test Case 9: Handle insufficient file system permissions
  test('Handle insufficient file system permissions', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => writeFileSync(csv, CSV_PATH_NO_PERMISSION)).toThrow('EACCES: permission denied');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_NO_PERMISSION, csv, { encoding: 'utf8' });
  });

  // Test Case 10: Handle file path that is a directory
  test('Handle file path that is a directory', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EISDIR: illegal operation on a directory');
    });

    expect(() => writeFileSync(csv, CSV_PATH_DIR)).toThrow('EISDIR: illegal operation on a directory');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_DIR, csv, { encoding: 'utf8' });
  });

  // Test Case 11: Do not write file for invalid CSV string
  test('Do not write file for invalid CSV string', () => {
    const csv = 'id,name,email\n1,User1\n2,User2,user2@example.com'; // missing email in first row
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid CSV format');
    });

    expect(() => writeFileSync(csv, CSV_PATH)).toThrow('Invalid CSV format');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});