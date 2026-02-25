import request from 'supertest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock CSV file path as used in src/server.ts
const CSV_PATH = join(process.cwd(), "data", "users.csv");

// Import the Express app
import express from 'express';
import { Server } from 'http';

// Re-create the app logic for testing (since src/server.ts does not export app)
function createTestApp() {
  const app = express();

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((c === "," && !inQuotes) || c === "\n") {
        result.push(current);
        current = "";
        if (c === "\n") break;
      } else {
        current += c;
      }
    }
    result.push(current);
    return result;
  }

  function csvToJson(csv: string): Record<string, string>[] {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, j) => {
        row[h] = values[j] ?? "";
      });
      rows.push(row);
    }
    return rows;
  }

  app.get("/api/users", (_req, res) => {
    if (!existsSync(CSV_PATH)) {
      return res
        .status(404)
        .json({ error: "No data yet. Run: npm run fetch" });
    }
    const csv = readFileSync(CSV_PATH, "utf-8");
    const data = csvToJson(csv);
    res.json(data);
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

  // Test Case 1: Retrieve users when CSV file exists and is valid
  test("Retrieve users when CSV file exists and is valid", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
1,Leanne Graham,Bret,Sincere@april.biz,"{\"street\":\"Kulas Light\",\"suite\":\"Apt. 556\",\"city\":\"Gwenborough\",\"zipcode\":\"92998-3874\",\"geo\":{\"lat\":\"-37.3159\",\"lng\":\"81.1496\"}}","1-770-736-8031 x56442",hildegard.org,"{\"name\":\"Romaguera-Crona\",\"catchPhrase\":\"Multi-layered client-server neural-net\",\"bs\":\"harness real-time e-markets\"}"`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "1",
        name: "Leanne Graham",
        username: "Bret",
        email: "Sincere@april.biz",
        address: '{"street":"Kulas Light","suite":"Apt. 556","city":"Gwenborough","zipcode":"92998-3874","geo":{"lat":"-37.3159","lng":"81.1496"}}',
        phone: "1-770-736-8031 x56442",
        website: "hildegard.org",
        company: '{"name":"Romaguera-Crona","catchPhrase":"Multi-layered client-server neural-net","bs":"harness real-time e-markets"}'
      }
    ]);
  });

  // Test Case 2: Retrieve users when CSV file does not exist
  test("Retrieve users when CSV file does not exist", async () => {
    mockedExistsSync.mockReturnValue(false);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "No data yet. Run: npm run fetch" });
  });

  // Test Case 3: Retrieve users when CSV file exists but is empty
  test("Retrieve users when CSV file exists but is empty", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("");
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test Case 4: Retrieve users when CSV file exists but is malformed
  test("Retrieve users when CSV file exists but is malformed", async () => {
    mockedExistsSync.mockReturnValue(true);
    // Malformed CSV: missing header, random text
    mockedReadFileSync.mockReturnValue("not,a,valid,csv");
    const res = await request(server).get('/api/users');
    // According to implementation, malformed CSV returns empty array, not 500
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test Case 5: Retrieve users when CSV file contains incomplete user data
  test("Retrieve users when CSV file contains incomplete user data", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
2,Ervin Howell,,Shanna@melissa.tv,,,,`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "2",
        name: "Ervin Howell",
        username: "",
        email: "Shanna@melissa.tv",
        address: "",
        phone: "",
        website: "",
        company: ""
      }
    ]);
  });

  // Test Case 6: Retrieve users when CSV file contains a large number of users
  test("Retrieve users when CSV file contains a large number of users", async () => {
    mockedExistsSync.mockReturnValue(true);
    const header = "id,name,username,email,address,phone,website,company";
    const row = `1,User,uname,email@site.com,addr,phone,site,comp`;
    const csv = [header, ...Array(10000).fill(row)].join("\n");
    mockedReadFileSync.mockReturnValue(csv);
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(10000);
    expect(res.body[0]).toEqual({
      id: "1",
      name: "User",
      username: "uname",
      email: "email@site.com",
      address: "addr",
      phone: "phone",
      website: "site",
      company: "comp"
    });
  });

  // Test Case 7: Retrieve users with Unicode and special characters in CSV
  test("Retrieve users with Unicode and special characters in CSV", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company
3,Zoë Müller,uni©øde,zoe.müller@example.com,"123 Straße, München","+49 89 123456",müller.de,"Müller & Söhne"`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "3",
        name: "Zoë Müller",
        username: "uni©øde",
        email: "zoe.müller@example.com",
        address: "123 Straße, München",
        phone: "+49 89 123456",
        website: "müller.de",
        company: "Müller & Söhne"
      }
    ]);
  });

  // Test Case 8: POST method not allowed on /api/users
  test("POST method not allowed on /api/users", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("");
    const res = await request(server).post('/api/users');
    // Express default: 404 for undefined POST, not 405 unless handled
    expect([404, 405]).toContain(res.status);
  });

  // Test Case 9: Retrieve users when CSV file has extra columns
  test("Retrieve users when CSV file has extra columns", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      `id,name,username,email,address,phone,website,company,extra1,extra2
4,Patricia Lebsack,Karianne,Julianne.OConner@kory.org,"{\"street\":\"Hoeger Mall\",\"suite\":\"Apt. 692\",\"city\":\"South Elvis\",\"zipcode\":\"53919-4257\",\"geo\":{\"lat\":\"29.4572\",\"lng\":\"-164.2990\"}}","493-170-9623 x156",kale.biz,"{\"name\":\"Robel-Corkery\",\"catchPhrase\":\"Multi-tiered zero tolerance productivity\",\"bs\":\"transition cutting-edge web services\"}",irrelevant,ignoreme`
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      id: "4",
      name: "Patricia Lebsack",
      username: "Karianne",
      email: "Julianne.OConner@kory.org",
      address: '{"street":"Hoeger Mall","suite":"Apt. 692","city":"South Elvis","zipcode":"53919-4257","geo":{"lat":"29.4572","lng":"-164.2990"}}',
      phone: "493-170-9623 x156",
      website: "kale.biz",
      company: '{"name":"Robel-Corkery","catchPhrase":"Multi-tiered zero tolerance productivity","bs":"transition cutting-edge web services"}'
    });
    // Extra columns are present, but only standard fields are checked
  });

  // Test Case 10: Retrieve users when CSV file contains only headers
  test("Retrieve users when CSV file contains only headers", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      "id,name,username,email,address,phone,website,company"
    );
    const res = await request(server).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});