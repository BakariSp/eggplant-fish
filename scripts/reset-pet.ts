/**
 * Script to fully reset a pet tag to unbound state
 * This will:
 * 1. Delete all images from Supabase Storage (avatars + post images)
 * 2. Delete the pet record from pets table (cascades to posts, contact_prefs, etc.)
 * 3. Reset the activation_codes entry (is_used=false, used_by=null, pet_id=null)
 * 
 * Usage: npx tsx scripts/reset-pet.ts <tag_code>
 * Example: npx tsx scripts/reset-pet.ts 2ZUCYBV9GWAE76
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage bucket name (all images go to user-image bucket)
const STORAGE_BUCKET = "user-image";

/**
 * Extract storage path from a public URL
 * URL format: https://xxx.supabase.co/storage/v1/object/public/user-image/posts/pet-id/image.webp
 */
function extractStoragePath(url: string): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/user-image\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete all files in a folder from Storage
 */
async function deleteStorageFolder(folder: string): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  try {
    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, { limit: 1000 });

    if (listError) {
      console.error(`   ❌ Error listing files in ${folder}:`, listError.message);
      return { deleted: 0, errors: 1 };
    }

    if (!files || files.length === 0) {
      return { deleted: 0, errors: 0 };
    }

    // Delete each file
    const filePaths = files.map(f => `${folder}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error(`   ❌ Error deleting files in ${folder}:`, deleteError.message);
      errors = filePaths.length;
    } else {
      deleted = filePaths.length;
    }
  } catch (err) {
    console.error(`   ❌ Unexpected error in ${folder}:`, err);
    errors = 1;
  }

  return { deleted, errors };
}

async function resetPetTag(tagCode: string) {
  console.log(`\n🔍 Looking for tag_code: ${tagCode}`);

  // 1. Find the pet by tag_code
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id, name, tag_code, owner_user_id, avatar_url")
    .eq("tag_code", tagCode)
    .maybeSingle();

  if (petError) {
    console.error("❌ Error finding pet:", petError.message);
    return;
  }

  // 2. Find the activation code
  const { data: activationCode, error: acError } = await supabase
    .from("activation_codes")
    .select("tag_code, box_code, is_used, used_by, pet_id")
    .eq("tag_code", tagCode)
    .maybeSingle();

  if (acError) {
    console.error("❌ Error finding activation code:", acError.message);
    return;
  }

  console.log("\n📋 Current State:");
  if (pet) {
    console.log(`   Pet: ${pet.name || "(no name)"} (ID: ${pet.id})`);
    console.log(`   Owner: ${pet.owner_user_id || "(none)"}`);
    console.log(`   Avatar URLs: ${Array.isArray(pet.avatar_url) ? pet.avatar_url.length : 0} images`);
  } else {
    console.log("   Pet: Not created yet");
  }
  
  if (activationCode) {
    console.log(`   Activation Code: ${activationCode.tag_code}`);
    console.log(`   Box Code: ${activationCode.box_code}`);
    console.log(`   Is Used: ${activationCode.is_used}`);
    console.log(`   Used By: ${activationCode.used_by || "(none)"}`);
    console.log(`   Pet ID: ${activationCode.pet_id || "(none)"}`);
  } else {
    console.log("   Activation Code: Not found");
  }

  if (pet) {
    const petId = pet.id;

    // 3. Get all posts to find image URLs before deletion
    console.log("\n🖼️  Cleaning up Storage files...");
    
    const { data: posts } = await supabase
      .from("pet_posts")
      .select("id, images")
      .eq("pet_id", petId);

    let totalImagesDeleted = 0;
    let totalErrors = 0;

    // 3a. Delete avatar images (stored in {petId}/ folder)
    console.log(`   Deleting avatar images from ${petId}/...`);
    const avatarResult = await deleteStorageFolder(petId);
    totalImagesDeleted += avatarResult.deleted;
    totalErrors += avatarResult.errors;
    if (avatarResult.deleted > 0) {
      console.log(`   ✅ Deleted ${avatarResult.deleted} avatar file(s)`);
    } else if (avatarResult.errors === 0) {
      console.log(`   ℹ️  No avatar files found`);
    }

    // 3b. Delete post images (stored in posts/{petId}/ folder)
    console.log(`   Deleting post images from posts/${petId}/...`);
    const postsResult = await deleteStorageFolder(`posts/${petId}`);
    totalImagesDeleted += postsResult.deleted;
    totalErrors += postsResult.errors;
    if (postsResult.deleted > 0) {
      console.log(`   ✅ Deleted ${postsResult.deleted} post image file(s)`);
    } else if (postsResult.errors === 0) {
      console.log(`   ℹ️  No post image files found`);
    }

    console.log(`   📊 Storage cleanup: ${totalImagesDeleted} files deleted, ${totalErrors} errors`);
  }

  // 4. Reset the activation code FIRST (to remove FK constraint)
  if (activationCode) {
    console.log("\n🔑 Resetting activation code...");
    const { error: resetError } = await supabase
      .from("activation_codes")
      .update({
        is_used: false,
        used_by: null,
        pet_id: null,
        used_at: null
      })
      .eq("tag_code", tagCode);

    if (resetError) {
      console.error("   ❌ Error resetting activation code:", resetError.message);
      return;
    }
    console.log("   ✅ Activation code reset");
  }

  // 5. Delete the pet if it exists (cascades to posts, contact_prefs, etc.)
  if (pet) {
    console.log("\n🐕 Deleting pet record...");
    const { error: deleteError } = await supabase
      .from("pets")
      .delete()
      .eq("id", pet.id);

    if (deleteError) {
      console.error("   ❌ Error deleting pet:", deleteError.message);
      return;
    }
    console.log("   ✅ Pet deleted (posts, contact_prefs, vaccinations cascaded)");
  }

  // 6. Verify the reset
  console.log("\n✅ Reset complete!");
  
  const { data: checkPet } = await supabase
    .from("pets")
    .select("id")
    .eq("tag_code", tagCode)
    .maybeSingle();

  const { data: checkCode } = await supabase
    .from("activation_codes")
    .select("is_used, pet_id")
    .eq("tag_code", tagCode)
    .maybeSingle();

  console.log("\n📋 Final State:");
  console.log(`   Pet exists: ${checkPet ? "Yes (ERROR!)" : "No ✓"}`);
  console.log(`   Activation code is_used: ${checkCode?.is_used ? "Yes (ERROR!)" : "No ✓"}`);
  console.log(`   Activation code pet_id: ${checkCode?.pet_id || "null ✓"}`);
  
  console.log(`\n🎯 Users visiting /landing?id=${tagCode} will now see the activation flow.`);
}

// Get tag_code from command line arguments
const tagCode = process.argv[2];

if (!tagCode) {
  console.log("Usage: npx tsx scripts/reset-pet.ts <tag_code>");
  console.log("Example: npx tsx scripts/reset-pet.ts 2ZUCYBV9GWAE76");
  process.exit(1);
}

resetPetTag(tagCode).catch(console.error);
