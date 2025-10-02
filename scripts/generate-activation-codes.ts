#!/usr/bin/env -S node

/*
  Generate unique activation code pairs (tag_code, box_code) and insert into
  the activation_codes table using Supabase service role credentials.

  Usage:
    npx tsx scripts/generate-activation-codes.ts --count 10 --length 14

  Required env:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

type InsertedPair = { tag_code: string; box_code: string };

const ALPHABETS = {
  // default safe uppercase + digits (no 0/1/O/I/U) used for tag_code
  SAFE32: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
  // Uppercase + digits for box_code (user input friendly)
  UPPER36: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
} as const;

function generateCode(length: number, alphabet: string): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = bytes[i] % alphabet.length;
    out += alphabet[idx];
  }
  return out;
}

function parseArgs(): { count: number; tagLen: number; boxLen: number } {
  const argv = process.argv.slice(2);
  let count = 10;
  let tagLen = 14;
  let boxLen = 14;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--count" && argv[i + 1]) {
      count = Math.max(1, parseInt(argv[i + 1], 10));
      i += 1;
    } else if (arg === "--length" && argv[i + 1]) {
      // backward compat sets both lengths
      const len = Math.max(6, parseInt(argv[i + 1], 10));
      tagLen = len;
      boxLen = len;
      i += 1;
    } else if (arg === "--tag-len" && argv[i + 1]) {
      tagLen = Math.max(8, parseInt(argv[i + 1], 10));
      i += 1;
    } else if (arg === "--box-len" && argv[i + 1]) {
      boxLen = Math.max(6, parseInt(argv[i + 1], 10));
      i += 1;
    }
  }
  return { count, tagLen, boxLen };
}

async function main() {
  // Load env from common files to support local execution
  const cwd = process.cwd();
  const envCandidates = [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
  ];
  for (const p of envCandidates) {
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

  const { count, tagLen, boxLen } = parseArgs();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const inserted: InsertedPair[] = [];

  console.log(`Generating ${count} activation code pairs (tag_len=${tagLen}, box_len=${boxLen})...`);

  // Sequential insertion keeps logic simple and avoids conflicting unique indexes.
  // This is acceptable for small batches (demo/testing). For large scale, batch and COPY.
  while (inserted.length < count) {
    // Ensure we don't generate identical tag and box in one pair
    let tag = generateCode(tagLen, ALPHABETS.SAFE32);
    let box = generateCode(boxLen, ALPHABETS.UPPER36);
    if (box === tag) {
      box = generateCode(length);
    }

    // Avoid duplicates within current run
    if (inserted.some(p => p.tag_code === tag || p.box_code === box)) {
      continue;
    }

    const { error } = await supabase
      .from("activation_codes")
      .insert([{ tag_code: tag, box_code: box }], { returning: "minimal" });

    if (error) {
      // If unique violation, retry with new codes; otherwise, abort
      const isUniqueViolation =
        typeof error.message === "string" &&
        /duplicate|unique|violates unique constraint|23505/i.test(error.message);
      if (isUniqueViolation) {
        continue;
      }
      console.error("Insert error:", error);
      process.exit(1);
    }

    inserted.push({ tag_code: tag, box_code: box });
    console.log(`${inserted.length}. tag=${tag}  box=${box}`);
  }

  console.log("\nDone. Inserted:");
  for (const [idx, p] of inserted.entries()) {
    console.log(`${idx + 1}\t${p.tag_code}\t${p.box_code}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


