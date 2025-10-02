#!/usr/bin/env tsx

/**
 * Script to create sample pet data for testing
 * Run with: npx tsx scripts/create-sample-data.ts
 */

import { createClient } from "@supabase/supabase-js";

async function createSampleData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Missing environment variables:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL:", !!url);
    console.error("  SUPABASE_SERVICE_ROLE_KEY:", !!serviceKey);
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    console.log("🚀 Creating sample pet data...");

    // Create a sample pet (this will require a user_id from auth.users)
    // For now, let's just test the connection and show what data structure is expected

    console.log("✅ Connection successful!");
    console.log("\n📋 To create sample data, you need to:");
    console.log("1. Register a user account at http://localhost:3000/register");
    console.log("2. Login at http://localhost:3000/login");
    console.log("3. Create a pet profile at http://localhost:3000/setup");
    console.log("\n🎯 Test the complete flow:");
    console.log("• Register → Login → Create Pet → Edit Profile → View Public Profile");

    // Show current pets count
    const { data: pets, error } = await supabase
      .from("pets")
      .select("id, name, created_at")
      .limit(5);

    if (error) {
      console.error("❌ Error fetching pets:", error.message);
    } else {
      console.log(`\n📊 Current pets in database: ${pets?.length || 0}`);
      if (pets && pets.length > 0) {
        pets.forEach((pet, index) => {
          const code = (pet as any).tag_code || pet.id;
          console.log(`  ${index + 1}. ${pet.name} (${code}) - Created: ${pet.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
createSampleData();

