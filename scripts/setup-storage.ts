#!/usr/bin/env tsx

/**
 * Setup script for Supabase Storage
 * Run this script to create the necessary storage buckets
 */

async function setupStorage() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000";
  const setupUrl = `${baseUrl}/api/storage/setup`;

  try {
    console.log("🚀 Setting up Supabase Storage buckets...");
    
    const response = await fetch(setupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Storage setup completed successfully!");
      
      if (result.results) {
        result.results.forEach((bucketResult: any) => {
          const status = bucketResult.success ? "✅" : "❌";
          console.log(`  ${status} ${bucketResult.bucket}: ${bucketResult.message || bucketResult.error}`);
        });
      }
    } else {
      console.error("❌ Storage setup failed:", result.error);
      if (result.details) {
        console.error("Details:", result.details);
      }
    }

  } catch (error) {
    console.error("❌ Failed to setup storage:", error);
    console.log("\n📋 Manual setup required:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to Storage");
    console.log("3. Create these buckets:");
    console.log("   - pet-avatars (public, 2MB limit)");
    console.log("   - pet-posts (public, 5MB limit)");
    console.log("   - user-uploads (private, 10MB limit)");
  }
}

// Run the setup
setupStorage();
