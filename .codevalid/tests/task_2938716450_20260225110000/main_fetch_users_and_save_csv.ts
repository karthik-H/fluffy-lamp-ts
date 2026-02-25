import { join } from "node:path";
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, rmdirSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { main } from "../../src/fetch-users";

const DATA_DIR = join(process.cwd(), "data");
const CSV_PATH = join(DATA_DIR, "users.csv");
const USERS_URL = "https://jsonplaceholder.typicode.com/users";

// Helper: mock fetch
function mockFetch(response: any, opts: { ok?: boolean; status?: number; delay?: number; throw?: boolean; } = {}) {
  global.fetch = jest.fn().mockImplementation(() => {
    if (opts.throw) return Promise.reject(new Error("Network error"));
    if (opts.delay) return new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), opts.delay));
    return Promise.resolve({
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(typeof response === "string" ? response : JSON.stringify(response)),
    });
  });
}

// Helper: clean up data dir and CSV
function cleanDataDir() {
  if (existsSync(CSV_PATH)) unlinkSync(CSV_PATH);
  if (existsSync(DATA_DIR)) {
    try {
      rmdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

// Helper: mock console
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  cleanDataDir();
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  cleanDataDir();
});

describe("main_fetch_users_and_save_csv", () => {
  // Test Case 1: Fetch users and generate CSV successfully
  it("Fetch users and generate CSV successfully", async () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      address: { street: `Street ${i + 1}`, city: `City ${i + 1}`, zipcode: `Zip${i + 1}` },
      phone: `123-456-789${i}`,
      website: `site${i + 1}.com`,
    }));
    mockFetch(users);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv.split("\n").length).toBe(11); // 1 header + 10 users
    users.forEach(u => {
      expect(csv).toContain(u.name);
      expect(csv).toContain(u.username);
      expect(csv).toContain(u.email);
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Saved 10 users to"));
  });

  // Test Case 2: API is unreachable and fetch fails
  it("API is unreachable and fetch fails", async () => {
    mockFetch(null, { throw: true });
    await expect(main()).rejects.toThrow();
    expect(existsSync(CSV_PATH)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  // Test Case 3: API returns empty array
  it("API returns empty array", async () => {
    mockFetch([]);
    await expect(main()).rejects.toThrow();
    expect(existsSync(CSV_PATH)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  // Test Case 4: User objects missing some fields
  it("User objects missing some fields", async () => {
    const users = [
      {
        id: 1,
        name: "A",
        username: "a",
        email: "a@x.com",
        address: { street: "A", city: "A", zipcode: "A" },
        phone: "a",
        website: "a.com"
      },
      {
        id: 2,
        name: "B",
        username: "b",
        email: "b@x.com",
        // address missing
        // phone missing
        website: "b.com"
      },
      {
        id: 3,
        name: "C",
        username: "c",
        email: "c@x.com",
        address: { street: "C", city: "C", zipcode: "C" },
        // phone missing
        // website missing
      }
    ];
    mockFetch(users);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    const rows = csv.split("\n");
    expect(rows.length).toBe(4); // header + 3 users
    // Each row should have empty values for missing fields
    rows.slice(1).forEach(row => {
      expect(row.split(",").length).toBe(rows[0].split(",").length);
    });
  });

  // Test Case 5: Fields contain commas and newlines
  it("Fields contain commas and newlines", async () => {
    const users = [
      {
        id: 1,
        name: 'John, "Doe"\nSmith',
        username: "john",
        email: "john@example.com",
        address: { street: "123 Main St", city: "Metropolis", zipcode: "12345" },
        phone: "123-456-7890",
        website: "john.com"
      }
    ];
    mockFetch(users);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    // CSV should escape commas, quotes, and newlines
    expect(csv).toMatch(/"John, ""Doe""\nSmith"/);
  });

  // Test Case 6: Data directory already exists
  it("Data directory already exists", async () => {
    const users = [
      {
        id: 1,
        name: "A",
        username: "a",
        email: "a@x.com",
        address: { street: "A", city: "A", zipcode: "A" },
        phone: "a",
        website: "a.com"
      }
    ];
    mkdirSync(DATA_DIR, { recursive: true });
    mockFetch(users);
    await main();
    expect(existsSync(DATA_DIR)).toBe(true);
    expect(existsSync(CSV_PATH)).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Saved 1 users to"));
  });

  // Test Case 7: File write operation fails
  it("File write operation fails", async () => {
    const users = [
      {
        id: 1,
        name: "A",
        username: "a",
        email: "a@x.com",
        address: { street: "A", city: "A", zipcode: "A" },
        phone: "a",
        website: "a.com"
      }
    ];
    mockFetch(users);
    mkdirSync(DATA_DIR, { recursive: true });
    const originalWriteFileSync = writeFileSync;
    (writeFileSync as any) = jest.fn(() => { throw new Error("EACCES: permission denied"); });
    await expect(main()).rejects.toThrow();
    expect(existsSync(CSV_PATH)).toBe(false);
    (writeFileSync as any) = originalWriteFileSync;
    expect(logSpy).not.toHaveBeenCalled();
  });

  // Test Case 8: API returns malformed JSON
  it("API returns malformed JSON", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Malformed JSON")),
        text: () => Promise.resolve("not json"),
      })
    );
    await expect(main()).rejects.toThrow();
    expect(existsSync(CSV_PATH)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  // Test Case 9: API returns a non-array JSON (unexpected structure)
  it("API returns a non-array JSON (unexpected structure)", async () => {
    mockFetch({ not: "array" });
    await expect(main()).rejects.toThrow();
    expect(existsSync(CSV_PATH)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  // Test Case 10: Repeated successful run overwrites CSV file
  it("Repeated successful run overwrites CSV file", async () => {
    const users = [
      {
        id: 1,
        name: "A",
        username: "a",
        email: "a@x.com",
        address: { street: "A", city: "A", zipcode: "A" },
        phone: "a",
        website: "a.com"
      }
    ];
    mockFetch(users);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv1 = readFileSync(CSV_PATH, "utf-8");
    mockFetch(users);
    await main();
    const csv2 = readFileSync(CSV_PATH, "utf-8");
    expect(csv2).toBe(csv1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Saved 1 users to"));
  });

  // Test Case 11: User fields have unexpected data types
  it("User fields have unexpected data types", async () => {
    const users = [
      {
        id: 1,
        name: null,
        username: 123,
        email: ["a@x.com", "b@x.com"],
        address: { street: "A", city: "A", zipcode: "A" },
        phone: undefined,
        website: { url: "a.com" }
      }
    ];
    mockFetch(users);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    // nulls should be empty, arrays/objects stringified
    expect(csv).toMatch(/,,/); // null and undefined become empty
    expect(csv).toContain(JSON.stringify(users[0].email));
    expect(csv).toContain(JSON.stringify(users[0].website));
  });
});