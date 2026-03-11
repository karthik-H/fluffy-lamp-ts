import { writeFileSync } from "node:fs";
import { join } from "node:path";

const USERS_URL = "https://jsonplaceholder.typicode.com/users";
const CSV_PATH = join(process.cwd(), "data", "users.csv");

interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
}

function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function userToRow(u: User): string[] {
  return [
    String(u.id),
    escapeCsvField(u.name),
    escapeCsvField(u.username),
    escapeCsvField(u.email),
    escapeCsvField(u.address?.street ?? ""),
    escapeCsvField(u.address?.city ?? ""),
    escapeCsvField(u.address?.zipcode ?? ""),
    escapeCsvField(u.phone ?? ""),
    escapeCsvField(u.website ?? ""),
  ];
}

async function main(): Promise<void> {
  const res = await fetch(USERS_URL);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const users: User[] = await res.json();

  const headers = [
    "id",
    "name",
    "username",
    "email",
    "street",
    "city",
    "zipcode",
    "phone",
    "website",
  ];
  const rows = [headers.join(","), ...users.map((u) => userToRow(u).join(","))];
  const csv = rows.join("\n");

  const { mkdirSync } = await import("node:fs");
  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(CSV_PATH, csv, "utf-8");
  console.log(`Saved ${users.length} users to ${CSV_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { userToRow, writeFileSync, main };
