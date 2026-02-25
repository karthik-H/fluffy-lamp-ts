import fs from 'fs';
import path from 'path';
import { writeFileSync } from '../../src/fetch-users';

// Mock fs for permission, path, and partial write tests
jest.mock('fs');

const CSV_PATH = path.join(__dirname, 'test_users.csv');
const CSV_PATH_INVALID = path.join(__dirname, 'nonexistent_dir', 'test_users.csv');
const CSV_PATH_NO_PERMISSION = '/root/test_users.csv';

describe('writeFileSync', () => {
  afterEach(() => {
    jest.clearAllMocks();
    if (fs.existsSync(CSV_PATH)) {
      fs.unlinkSync(CSV_PATH);
    }
  });

  test('Write CSV File with Normal User Data', () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `123-456-789${i}`,
    }));
    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(u => Object.values(u).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
  });

  test('Overwrite Existing CSV File', () => {
    const oldContent = 'id,name,email,phone\n1,OldUser,old@example.com,000-000-0000';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = oldContent;
    });
    fs.writeFileSync(CSV_PATH, oldContent, { encoding: 'utf8' });

    const newUsers = [
      { id: 2, name: 'NewUser', email: 'new@example.com', phone: '111-111-1111' },
    ];
    const headers = Object.keys(newUsers[0]).join(',');
    const rows = newUsers.map(u => Object.values(u).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
  });

  test('No File Created for Empty User List', () => {
    const csv = '';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('No data to write');
    });

    expect(() => writeFileSync(csv, CSV_PATH)).toThrow('No data to write');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('No File Written on API Failure', () => {
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('No CSV string provided');
    });

    expect(() => writeFileSync(undefined as any, CSV_PATH)).toThrow('No CSV string provided');
    expect(() => writeFileSync(null as any, CSV_PATH)).toThrow('No CSV string provided');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('Write CSV with Missing Fields in Some Users', () => {
    const users = [
      { id: 1, name: 'User1', email: 'user1@example.com', phone: '123-456-7890' },
      { id: 2, name: 'User2', email: 'user2@example.com' }, // missing phone
    ];
    const headers = 'id,name,email,phone';
    const rows = [
      `${users[0].id},${users[0].name},${users[0].email},${users[0].phone}`,
      `${users[1].id},${users[1].name},${users[1].email},`,
    ].join('\n');
    const csv = `${headers}\n${rows}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toBe(csv);
  });

  test('Write CSV File with Large Number of Users', () => {
    const users = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `123-456-789${i % 10}`,
    }));
    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(u => Object.values(u).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent.length).toBeGreaterThan(10000);
  });

  test('Fail to Write CSV File due to No Write Permission', () => {
    const csv = 'id,name,email,phone\n1,User1,user1@example.com,123-456-7890';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => writeFileSync(csv, CSV_PATH_NO_PERMISSION)).toThrow('EACCES: permission denied');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_NO_PERMISSION, csv, { encoding: 'utf8' });
  });

  test('Fail to Write CSV File due to Invalid Path', () => {
    const csv = 'id,name,email,phone\n1,User1,user1@example.com,123-456-7890';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => writeFileSync(csv, CSV_PATH_INVALID)).toThrow('ENOENT: no such file or directory');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH_INVALID, csv, { encoding: 'utf8' });
  });

  test('Write CSV File with Special Characters in User Data', () => {
    const users = [
      {
        id: 1,
        name: 'User, "One"\nNewline',
        email: 'user1@example.com',
        phone: '123-456-7890',
      },
    ];
    const headers = Object.keys(users[0]).join(',');
    const row = [
      users[0].id,
      `"${users[0].name.replace(/"/g, '""')}"`,
      users[0].email,
      users[0].phone,
    ].join(',');
    const csv = `${headers}\n${row}`;

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      fs.__mockFileContent = csv;
    });

    writeFileSync(csv, CSV_PATH);

    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    expect(fs.__mockFileContent).toContain('"User, ""One""\nNewline"');
  });

  test('Partial Write is Not Allowed', () => {
    const csv = 'id,name,email,phone\n1,User1,user1@example.com,123-456-7890';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Disk full');
    });

    expect(() => writeFileSync(csv, CSV_PATH)).toThrow('Disk full');
    expect(fs.writeFileSync).toHaveBeenCalledWith(CSV_PATH, csv, { encoding: 'utf8' });
    // Simulate cleanup: file should not exist after error
    expect(fs.existsSync(CSV_PATH)).toBe(false);
  });
});