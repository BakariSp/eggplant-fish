#!/usr/bin/env -S node

/*
  Import activation_codes from a CSV (tag_code,box_code) into Supabase.

  Usage:
    npx tsx scripts/import-activation-codes.ts --file activation_codes_YYYYMMDD_HHMM.csv
    (Optional) --batch 500   // insert batch size, default 500

  Required env:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

type Pair = { tag_code: string; box_code: string };

function parseArgs(): { file: string; batch: number } {
  const argv = process.argv.slice(2);
  let file = "";
  let batch = 500;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      file = argv[i + 1];
      i += 1;
    } else if (arg === "--batch" && argv[i + 1]) {
      batch = Math.max(1, parseInt(argv[i + 1], 10));
      i += 1;
    }
  }
  if (!file) {
    console.error("Missing required arg: --file <path/to/csv>");
    process.exit(1);
  }
  return { file, batch };
}

function parseCsv(content: string): Pair[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const out: Pair[] = [];
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    if (idx === 0 && /^tag_code\s*,\s*box_code$/i.test(line)) {
      continue; // skip header
    }
    // Our export produces unquoted, comma-separated codes without commas inside
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const tag = parts[0].trim().replace(/^"+|"+$/g, "");
    const box = parts[1].trim().replace(/^"+|"+$/g, "");
    if (!tag || !box) continue;
    out.push({ tag_code: tag, box_code: box });
  }
  return out;
}

async function main() {
  // Load env
  const cwd = process.cwd();
  for (const p of [path.join(cwd, ".env.local"), path.join(cwd, ".env")]) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const { file, batch } = parseArgs();
  const abs = path.isAbsolute(file) ? file : path.join(cwd, file);
  if (!fs.existsSync(abs)) {
    console.error(`CSV not found: ${abs}`);
    process.exit(1);
  }

  const csv = fs.readFileSync(abs, "utf8");
  const pairs = parseCsv(csv);
  if (pairs.length === 0) {
    console.error("CSV has no valid rows (expected header 'tag_code,box_code' and data).");
    process.exit(1);
  }
  console.log(`Parsed ${pairs.length} rows from ${path.basename(abs)}. Inserting in batches of ${batch}...`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let inserted = 0;
  for (let i = 0; i < pairs.length; i += batch) {
    const chunk = pairs.slice(i, i + batch);
    const { error } = await supabase
      .from("activation_codes")
      .upsert(chunk, { onConflict: "tag_code,box_code", ignoreDuplicates: true });
    if (error) {
      // Best-effort duplicate handling via upsert; if other errors occur, stop.
      console.error("Insert error:", error);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Inserted ${Math.min(inserted, pairs.length)} / ${pairs.length}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




