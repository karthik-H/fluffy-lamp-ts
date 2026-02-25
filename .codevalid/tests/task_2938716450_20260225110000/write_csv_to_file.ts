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

  // Test Case 1: Write CSV file successfully when valid CSV string is provided
  test('Write CSV file successfully when valid CSV string is provided', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com\n2,User2,user2@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
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
  });

  // Test Case 3: Write empty CSV string
  test('Write empty CSV string', () => {
    const csv = '';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe('');
  });

  // Test Case 4: Fail to write CSV file to invalid path
  test('Fail to write CSV file to invalid path', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => writeFileSync(csv, CSV_PATH_INVALID)).toThrow('ENOENT: no such file or directory');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_INVALID, csv, { encoding: 'utf8' });
  });

  // Test Case 5: Write large CSV string to file
  test('Write large CSV string to file', () => {
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
    expect(fs.__mockFileContent.length).toBeGreaterThan(10000);
  });

  // Test Case 6: Handle null CSV string input
  test('Handle null CSV string input', () => {
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('No CSV string provided');
    });

    expect(() => writeFileSync(null as any, CSV_PATH)).toThrow('No CSV string provided');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  // Test Case 7: Handle undefined CSV string input
  test('Handle undefined CSV string input', () => {
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('No CSV string provided');
    });

    expect(() => writeFileSync(undefined as any, CSV_PATH)).toThrow('No CSV string provided');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  // Test Case 8: Fail to write CSV string to read-only file
  test('Fail to write CSV string to read-only file', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => writeFileSync(csv, CSV_PATH_READONLY)).toThrow('EACCES: permission denied');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_READONLY, csv, { encoding: 'utf8' });
  });

  // Test Case 9: Write CSV string containing special characters
  test('Write CSV string containing special characters', () => {
    const csv = 'id,name,email\n1,"User, ""One""\nNewline",user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toContain('"User, ""One""\nNewline"');
  });

  // Test Case 10: Fail to write if directory is not writable
  test('Fail to write if directory is not writable', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => writeFileSync(csv, CSV_PATH_UNWRITABLE_DIR)).toThrow('EACCES: permission denied');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_UNWRITABLE_DIR, csv, { encoding: 'utf8' });
  });

  // Test Case 11: Fail if CSV_PATH is a directory
  test('Fail if CSV_PATH is a directory', () => {
    const csv = 'id,name,email\n1,User1,user1@example.com';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EISDIR: illegal operation on a directory');
    });

    expect(() => writeFileSync(csv, CSV_PATH_DIR)).toThrow('EISDIR: illegal operation on a directory');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_DIR, csv, { encoding: 'utf8' });
  });
});