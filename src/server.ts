import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
 
const app = express();
const PORT = 3000;
const CSV_PATH = join(process.cwd(), "data", "users.csv");
const PUBLIC_DIR = join(process.cwd(), "public");

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

function csvToJson(csv: string): Record<string, any>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, any> = {};
    headers.forEach((h, j) => {
      let v = values[j] ?? "";
      if ((h === "address" || h === "company") && v && v.startsWith("{") && v.endsWith("}")) {
        try {
          v = JSON.parse(v.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"'));
        } catch {
          // leave as string if parsing fails
        }
      }
      row[h] = v;
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

app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});

export { parseCsvLine, csvToJson };
