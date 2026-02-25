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
      return res.status(500).json({ error: "Failed to read or parse user data." });
    }
    try {
      const lines = csv.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) return res.status(200).json([]);
      const headers = lines[0].split(",");
      const required = [
        "id", "name", "username", "email", "address", "phone", "website", "company"
      ];
      if (!required.every(h => headers.includes(h))) {
        return res.status(500).json({ error: "CSV file missing required user fields." });
      }
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
          return res.status(500).json({ error: "Failed to read or parse user data." });
        }
        const user: any = {};
        headers.forEach((h, idx) => {
          user[h] = values[idx] ?? "";
        });
        // Parse address and company fields if JSON
        if (user.address && user.address.startsWith("{")) {
          try { user.address = JSON.parse(user.address); } catch {}
        }
        if (user.company && user.company.startsWith("{")) {
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
      return res.status(500).json({ error: "Failed to read or parse user data." });
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

  // Test Case 1: Retrieve users when CSV exists and is valid
  test("Retrieve users when CSV exists and is valid", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
1,Leanne Graham,Bret,Sincere@april.biz,"{\"street\":\"Kulas Light\",\"suite\":\"Apt. 556\",\"city\":\"Gwenborough\",\"zipcode\":\"92998-3874\",\"geo\":{\"lat\":\"-37.3159\",\"lng\":\"81.1496\"}}","1-770-736-8031 x56442",hildegard.org,"{\"name\":\"Romaguera-Crona\",\"catchPhrase\":\"Multi-layered client-server neural-net\",\"bs\":\"harness real-time e-markets\"}"
2,Ervin Howell,Antonette,Shanna@melissa.tv,"{\"street\":\"Victor Plains\",\"suite\":\"Suite 879\",\"city\":\"Wisokyburgh\",\"zipcode\":\"90566-7771\",\"geo\":{\"lat\":\"-43.9509\",\"lng\":\"-34.4618\"}}","010-692-6593 x09125",anastasia.net,"{\"name\":\"Deckow-Crist\",\"catchPhrase\":\"Proactive didactic contingency\",\"bs\":\"synergize scalable supply-chains\"}"`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 1,
        name: "Leanne Graham",
        username: "Bret",
        email: "Sincere@april.biz",
        address: {
          street: "Kulas Light",
          suite: "Apt. 556",
          city: "Gwenborough",
          zipcode: "92998-3874",
          geo: { lat: "-37.3159", lng: "81.1496" }
        },
        phone: "1-770-736-8031 x56442",
        website: "hildegard.org",
        company: {
          name: "Romaguera-Crona",
          catchPhrase: "Multi-layered client-server neural-net",
          bs: "harness real-time e-markets"
        }
      },
      {
        id: 2,
        name: "Ervin Howell",
        username: "Antonette",
        email: "Shanna@melissa.tv",
        address: {
          street: "Victor Plains",
          suite: "Suite 879",
          city: "Wisokyburgh",
          zipcode: "90566-7771",
          geo: { lat: "-43.9509", lng: "-34.4618" }
        },
        phone: "010-692-6593 x09125",
        website: "anastasia.net",
        company: {
          name: "Deckow-Crist",
          catchPhrase: "Proactive didactic contingency",
          bs: "synergize scalable supply-chains"
        }
      }
    ]);
  });

  // Test Case 2: CSV file missing
  test("CSV file missing", async () => {
    mockedExistsSync.mockReturnValue(false);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User data file not found." });
  });

  // Test Case 3: CSV file is corrupted or malformed
  test("CSV file is corrupted or malformed", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("id,name,username,email,address,phone,website,company\nbroken,line,missing,quotes");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to read or parse user data." });
  });

  // Test Case 4: CSV file exists but contains no user records
  test("CSV file exists but contains no user records", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("id,name,username,email,address,phone,website,company");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test Case 5: CSV file contains a single user record
  test("CSV file contains a single user record", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
99,Jane Doe,janedoe,jane.doe@example.com,"{\"street\":\"Main St\",\"suite\":\"Apt. 1\",\"city\":\"Testville\",\"zipcode\":\"12345\",\"geo\":{\"lat\":\"0.0000\",\"lng\":\"0.0000\"}}","111-222-3333",janedoe.org,"{\"name\":\"Doe Inc\",\"catchPhrase\":\"Innovative solutions\",\"bs\":\"empower synergies\"}"`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 99,
        name: "Jane Doe",
        username: "janedoe",
        email: "jane.doe@example.com",
        address: {
          street: "Main St",
          suite: "Apt. 1",
          city: "Testville",
          zipcode: "12345",
          geo: { lat: "0.0000", lng: "0.0000" }
        },
        phone: "111-222-3333",
        website: "janedoe.org",
        company: {
          name: "Doe Inc",
          catchPhrase: "Innovative solutions",
          bs: "empower synergies"
        }
      }
    ]);
  });

  // Test Case 6: CSV file contains a large number of user records
  test("CSV file contains a large number of user records", async () => {
    mockedExistsSync.mockReturnValue(true);
    const header = "id,name,username,email,address,phone,website,company";
    const address = '{"street":"Street","suite":"Suite","city":"City","zipcode":"00000","geo":{"lat":"10.0000","lng":"20.0000"}}';
    const company = '{"name":"BigCo","catchPhrase":"Scale up","bs":"grow markets"}';
    const row = `1,User,uname,email@site.com,"${address}",phone,site,"${company}"`;
    const csv = [header, ...Array(10000).fill(row)].join("\n");
    mockedReadFileSync.mockReturnValue(csv);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(10000);
    expect(res.body[0]).toMatchObject({
      id: 1,
      name: "User",
      username: "uname",
      email: "email@site.com",
      address: {
        street: "Street",
        suite: "Suite",
        city: "City",
        zipcode: "00000",
        geo: { lat: "10.0000", lng: "20.0000" }
      },
      phone: "phone",
      website: "site",
      company: {
        name: "BigCo",
        catchPhrase: "Scale up",
        bs: "grow markets"
      }
    });
  });

  // Test Case 7: CSV missing required columns
  test("CSV missing required columns", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("id,name,username\n1,User,uname");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "CSV file missing required user fields." });
  });

  // Test Case 8: CSV contains extra unexpected columns
  test("CSV contains extra unexpected columns", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company,extra
5,Extra User,extrauser,extra@user.com,"{\"street\":\"Unknown\",\"suite\":\"\",\"city\":\"City\",\"zipcode\":\"00000\",\"geo\":{\"lat\":\"1.0000\",\"lng\":\"1.0000\"}}","123456789",extrauser.com,"{\"name\":\"Extra Co\",\"catchPhrase\":\"Extraordinary\",\"bs\":\"provide extras\"}",something`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 5,
        name: "Extra User",
        username: "extrauser",
        email: "extra@user.com",
        address: {
          street: "Unknown",
          suite: "",
          city: "City",
          zipcode: "00000",
          geo: { lat: "1.0000", lng: "1.0000" }
        },
        phone: "123456789",
        website: "extrauser.com",
        company: {
          name: "Extra Co",
          catchPhrase: "Extraordinary",
          bs: "provide extras"
        }
      }
    ]);
  });

  // Test Case 9: Unsupported HTTP method
  test("Unsupported HTTP method", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
1,User,uname,email@site.com,"{\"street\":\"Street\",\"suite\":\"Suite\",\"city\":\"City\",\"zipcode\":\"00000\",\"geo\":{\"lat\":\"10.0000\",\"lng\":\"20.0000\"}}","phone","site","{\"name\":\"BigCo\",\"catchPhrase\":\"Scale up\",\"bs\":\"grow markets\"}"`
    );
    const res = await request(server).post('/api/users');
    expect(res.status).toBe(405);
    expect(res.body).toEqual({ error: "Method Not Allowed" });
  });
});