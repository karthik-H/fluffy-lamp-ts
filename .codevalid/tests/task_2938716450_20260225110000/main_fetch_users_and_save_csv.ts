import { join } from "node:path";
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, rmdirSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

// Import main from src/fetch-users.ts
import { main } from "../../src/fetch-users";

// Constants
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
  // Test Case 1
  it("Fetch users successfully and create CSV file", async () => {
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
    expect(csv.startsWith("id,name,username,email,street,city,zipcode,phone,website")).toBe(true);
    users.forEach(u => {
      expect(csv).toContain(u.name);
      expect(csv).toContain(u.username);
      expect(csv).toContain(u.email);
    });
  });

  // Test Case 2
  it("API fetch fails and triggers error", async () => {
    mockFetch(null, { ok: false, status: 500 });
    await expect(main()).rejects.toThrow("Failed to fetch users: 500");
    expect(existsSync(CSV_PATH)).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled(); // main throws, not logs
  });

  // Test Case 3
  it("API returns empty array", async () => {
    mockFetch([]);
    await expect(main()).resolves.toBeUndefined();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv.split("\n").length).toBe(1); // Only header
    expect(csv).toBe("id,name,username,email,street,city,zipcode,phone,website");
  });

  // Test Case 4
  it("Existing CSV file is overwritten on successful fetch", async () => {
    mockFetch([{ id: 1, name: "Old", username: "old", email: "old@x.com", address: { street: "Old", city: "Old", zipcode: "Old" }, phone: "old", website: "old.com" }]);
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CSV_PATH, "old,data", "utf-8");
    await main();
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv).toContain("Old");
    expect(csv).not.toContain("old,data");
  });

  // Test Case 5
  it("Data directory is created if it does not exist", async () => {
    mockFetch([{ id: 1, name: "A", username: "a", email: "a@x.com", address: { street: "A", city: "A", zipcode: "A" }, phone: "a", website: "a.com" }]);
    cleanDataDir();
    await main();
    expect(existsSync(DATA_DIR)).toBe(true);
    expect(existsSync(CSV_PATH)).toBe(true);
  });

  // Test Case 6
  it("All user fields are preserved in CSV output", async () => {
    const users = [
      {
        id: 1,
        name: "A",
        username: "a",
        email: "a@x.com",
        address: { street: "A", city: "A", zipcode: "A" },
        phone: null,
        website: "a.com"
      },
      {
        id: 2,
        name: "B, \"quoted\"\nNewline",
        username: "b",
        email: "b@x.com",
        address: { street: "B", city: "B", zipcode: "B" },
        phone: "b",
        website: null
      }
    ];
    mockFetch(users);
    await main();
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv).toContain("A");
    expect(csv).toContain("B, \"quoted\"\nNewline");
    expect(csv).toContain("b@x.com");
    expect(csv).toContain("a.com");
    expect(csv).toContain("b");
    expect(csv.split("\n").length).toBe(3);
  });

  // Test Case 7
  it("CSV file is accessible after creation", async () => {
    mockFetch([{ id: 1, name: "A", username: "a", email: "a@x.com", address: { street: "A", city: "A", zipcode: "A" }, phone: "a", website: "a.com" }]);
    await main();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv).toContain("A");
  });

  // Test Case 8
  it("API returns non-array JSON, signals error", async () => {
    mockFetch({ not: "array" });
    await expect(main()).resolves.toBeUndefined();
    expect(existsSync(CSV_PATH)).toBe(true);
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv.split("\n").length).toBe(1); // Only header
  });

  // Test Case 9
  it("API returns malformed JSON, signals error", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Malformed JSON")),
        text: () => Promise.resolve("not json"),
      })
    );
    await expect(main()).rejects.toThrow("Malformed JSON");
    expect(existsSync(CSV_PATH)).toBe(false);
  });

  // Test Case 10
  it("Users with missing fields produce consistent CSV columns", async () => {
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
        address: { street: "B", city: "B", zipcode: "B" },
        // phone and website missing
      }
    ];
    mockFetch(users);
    await main();
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv.split("\n").length).toBe(3);
    expect(csv).toContain("A");
    expect(csv).toContain("B");
    // Second row should have empty cells for missing fields
    const rows = csv.split("\n");
    expect(rows[2].split(",").length).toBe(9);
  });

  // Test Case 11
  it("Existing CSV is not modified on API error", async () => {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CSV_PATH, "old,data", "utf-8");
    mockFetch(null, { ok: false, status: 500 });
    await expect(main()).rejects.toThrow();
    const csv = readFileSync(CSV_PATH, "utf-8");
    expect(csv).toBe("old,data");
  });

  // Test Case 12
  it("Logs success after CSV creation", async () => {
    mockFetch([{ id: 1, name: "A", username: "a", email: "a@x.com", address: { street: "A", city: "A", zipcode: "A" }, phone: "a", website: "a.com" }]);
    await main();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Saved 1 users to"));
  });

  // Test Case 13
  it("Network timeout results in error and no file", async () => {
    mockFetch(null, { delay: 10, throw: true });
    await expect(main()).rejects.toThrow("Network error");
    expect(existsSync(CSV_PATH)).toBe(false);
  });

  // Test Case 14
  it("Special characters in user fields are correctly escaped in CSV", async () => {
    const users = [
      {
        id: 1,
        name: 'John, "Doe"\nNewline',
        username: "jdoe",
        email: "jdoe@example.com",
        address: { street: "123, Main", city: "Metropolis", zipcode: "12345" },
        phone: '555-1234',
        website: 'john,doe.com'
      }
    ];
    mockFetch(users);
    await main();
    const csv = readFileSync(CSV_PATH, "utf-8");
    // CSV escaping: quotes, commas, newlines
    expect(csv).toContain('"John, ""Doe""\nNewline"');
    expect(csv).toContain('"123, Main"');
    expect(csv).toContain('"john,doe.com"');
  });
});