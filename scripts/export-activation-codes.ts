#!/usr/bin/env -S node

/*
  Export activation_codes to a CSV file that Excel can open.

  Usage:
    npx tsx scripts/export-activation-codes.ts --limit 100

  Required env:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

type Row = { tag_code: string; box_code: string; id?: number; created_at?: string };

function parseArgs(): { limit: number } {
  const argv = process.argv.slice(2);
  let limit = 100;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[i + 1], 10));
      i += 1;
    }
  }
  return { limit };
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

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { limit } = parseArgs();

  // Prefer created_at desc; fallback to id desc
  let rows: Row[] = [];
  {
    const { data, error } = await supabase
      .from("activation_codes")
      .select("tag_code, box_code, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) {
      rows = data as Row[];
    } else {
      const fb = await supabase
        .from("activation_codes")
        .select("tag_code, box_code, id")
        .order("id", { ascending: false })
        .limit(limit);
      if (fb.error) {
        console.error("Query failed:", error || fb.error);
        process.exit(1);
      }
      rows = (fb.data || []) as Row[];
    }
  }

  if (rows.length === 0) {
    console.log("No activation codes found.");
    return;
  }

  // CSV content (plain values, no quotes)
  const header = ["tag_code", "box_code"]; 
  const lines = [header.join(",")];
  for (const r of rows) {
    const fields = [r.tag_code, r.box_code];
    lines.push(fields.join(","));
  }

  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}`;
  const outName = `activation_codes_${stamp}.csv`;
  const outPath = path.join(cwd, outName);
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Exported ${rows.length} rows to ${outName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


