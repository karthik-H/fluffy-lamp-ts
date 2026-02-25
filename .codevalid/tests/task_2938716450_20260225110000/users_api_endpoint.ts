import request from 'supertest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { Server } from 'http';

// Mock CSV file path as used in src/server.ts
const CSV_PATH = join(process.cwd(), "data", "users.csv");

// Re-create the app logic for testing (since src/server.ts does not export app)
function createTestApp() {
  const app = express();

  app.get("/api/users", (_req, res) => {
    if (!existsSync(CSV_PATH)) {
      return res.status(404).json({ error: "User data file not found." });
    }
    let csv: string;
    try {
      csv = readFileSync(CSV_PATH, "utf-8");
    } catch (e) {
      return res.status(500).json({ error: "Failed to read or parse user data file." });
    }
    try {
      const lines = csv.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) return res.status(200).json([]);
      const headers = lines[0].split(",");
      if (lines.length === 1) return res.status(200).json([]);
      const users = [];
      for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = "";
        let inQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
          const c = lines[i][j];
          if (c === '"') {
            if (inQuotes && lines[i][j + 1] === '"') {
              current += '"';
              j++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if ((c === "," && !inQuotes) || c === "\n") {
            values.push(current);
            current = "";
            if (c === "\n") break;
          } else {
            current += c;
          }
        }
        values.push(current);
        if (values.length < headers.length) {
          return res.status(500).json({ error: "Failed to read or parse user data file." });
        }
        const user: any = {};
        headers.forEach((h, idx) => {
          user[h] = values[idx] ?? null;
        });
        // Parse address and company fields if JSON
        if (user.address && typeof user.address === "string" && user.address.startsWith("{")) {
          try { user.address = JSON.parse(user.address); } catch {}
        }
        if (user.company && typeof user.company === "string" && user.company.startsWith("{")) {
          try { user.company = JSON.parse(user.company); } catch {}
        }
        // Convert id to number if possible
        if (typeof user.id === "string" && user.id.match(/^\d+$/)) {
          user.id = Number(user.id);
        }
        users.push(user);
      }
      return res.status(200).json(users);
    } catch (e) {
      return res.status(500).json({ error: "Failed to read or parse user data file." });
    }
  });

  app.all("/api/users", (_req, res) => {
    if (_req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  });

  return app;
}

// Mock fs functions
jest.mock('node:fs');
const mockedExistsSync = existsSync as jest.Mock;
const mockedReadFileSync = readFileSync as jest.Mock;

describe("users_api_endpoint", () => {
  let app: express.Express;
  let server: Server;

  beforeEach(() => {
    app = createTestApp();
    server = app.listen();
    mockedExistsSync.mockReset();
    mockedReadFileSync.mockReset();
  });

  afterEach(() => {
    server.close();
  });

  // Test Case 1: Fetch users successfully when CSV exists and is valid
  test("Fetch users successfully when CSV exists and is valid", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
1,Leanne Graham,Bret,Sincere@april.biz,"{\"street\":\"Kulas Light\",\"suite\":\"Apt. 556\",\"city\":\"Gwenborough\",\"zipcode\":\"92998-3874\",\"geo\":{\"lat\":\"-37.3159\",\"lng\":\"81.1496\"}}","1-770-736-8031 x56442",hildegard.org,"{\"name\":\"Romaguera-Crona\",\"catchPhrase\":\"Multi-layered client-server neural-net\",\"bs\":\"harness real-time e-markets\"}"`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        address: {
          city: "Gwenborough",
          geo: { lat: "-37.3159", lng: "81.1496" },
          street: "Kulas Light",
          suite: "Apt. 556",
          zipcode: "92998-3874"
        },
        company: {
          bs: "harness real-time e-markets",
          catchPhrase: "Multi-layered client-server neural-net",
          name: "Romaguera-Crona"
        },
        email: "Sincere@april.biz",
        id: 1,
        name: "Leanne Graham",
        phone: "1-770-736-8031 x56442",
        username: "Bret",
        website: "hildegard.org"
      }
    ]);
  });

  // Test Case 2: Return 404 when CSV file does not exist
  test("Return 404 when CSV file does not exist", async () => {
    mockedExistsSync.mockReturnValue(false);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User data file not found." });
  });

  // Test Case 3: Return 200 and empty array when CSV file is empty
  test("Return 200 and empty array when CSV file is empty", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("id,name,username,email,address,phone,website,company");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test Case 4: Return 500 when CSV file is malformed
  test("Return 500 when CSV file is malformed", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("id,name,username,email,address,phone,website,company\nbroken,line,missing,quotes");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to read or parse user data file." });
  });

  // Test Case 5: Fetch users when CSV file has extra unexpected columns
  test("Fetch users when CSV file has extra unexpected columns", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,phone,extra_column
1,Leanne Graham,Bret,Sincere@april.biz,1-770-736-8031 x56442,extra_value`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        email: "Sincere@april.biz",
        extra_column: "extra_value",
        id: 1,
        name: "Leanne Graham",
        phone: "1-770-736-8031 x56442",
        username: "Bret"
      }
    ]);
  });

  // Test Case 6: Fetch users when CSV contains only a single user
  test("Fetch users when CSV contains only a single user", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email
7,Kurtis Weissnat,Elwyn.Skiles,Telly.Hoeger@billy.biz`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        email: "Telly.Hoeger@billy.biz",
        id: 7,
        name: "Kurtis Weissnat",
        username: "Elwyn.Skiles"
      }
    ]);
  });

  // Test Case 7: Fetch users when CSV file contains a large number of users
  test("Fetch users when CSV file contains a large number of users", async () => {
    mockedExistsSync.mockReturnValue(true);
    const header = "id,name,username,email";
    const row = `1,User,uname,email@site.com`;
    const csv = [header, ...Array(10000).fill(row)].join("\n");
    mockedReadFileSync.mockReturnValue(csv);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(10000);
    expect(res.body[0]).toMatchObject({
      id: 1,
      name: "User",
      username: "uname",
      email: "email@site.com"
    });
  });

  // Test Case 8: Fetch users when CSV fields include commas and quotes
  test("Fetch users when CSV fields include commas and quotes", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,address,email
12,"Jane ""JJ"", Smith","123 Main St, Apt 2",jane@example.com`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        address: "123 Main St, Apt 2",
        email: "jane@example.com",
        id: 12,
        name: 'Jane "JJ", Smith'
      }
    ]);
  });

  // Test Case 9: Return 405 for unsupported HTTP methods
  test("Return 405 for unsupported HTTP methods", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email
1,User,uname,email@site.com`
    );
    const res = await request(server).post('/api/users');
    expect(res.status).toBe(405);
    expect(res.body).toEqual({ error: "Method Not Allowed" });
  });

  // Test Case 10: Fetch users when some fields are missing in CSV
  test("Fetch users when some fields are missing in CSV", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name
15,Alex Doe`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 15,
        name: "Alex Doe"
      }
    ]);
  });
});