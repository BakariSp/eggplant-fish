import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, getAdminSupabaseClient } from "../../../../lib/supabase";
import { STORAGE_BUCKETS } from "../../../../lib/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if all required buckets exist and are accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return NextResponse.json({
        success: false,
        error: "Cannot access storage buckets",
        details: listError.message
      }, { status: 500 });
    }

    const requiredBuckets = Object.values(STORAGE_BUCKETS);
    const existingBuckets = buckets?.map(b => b.id) || [];
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket));

    if (missingBuckets.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Missing required buckets",
        message: "Please create the following buckets in your Supabase dashboard",
        missingBuckets,
        instructions: [
          "1. Go to your Supabase dashboard",
          "2. Navigate to Storage",
          "3. Create the following buckets:",
          ...missingBuckets.map(bucket => `   - ${bucket} (public: true)`),
          "4. Set file size limits and allowed MIME types as needed"
        ]
      }, { status: 404 });
    }

    // Test access to each bucket
    const bucketTests = await Promise.all(
      requiredBuckets.map(async (bucketId) => {
        const { error } = await supabase.storage
          .from(bucketId)
          .list("", { limit: 1 });
        
        return {
          bucket: bucketId,
          accessible: !error,
          error: error?.message || null
        };
      })
    );

    const inaccessibleBuckets = bucketTests.filter(test => !test.accessible);

    if (inaccessibleBuckets.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Some buckets are not accessible",
        inaccessibleBuckets,
        message: "Please check bucket permissions and policies"
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: "All storage buckets are ready to use",
      buckets: bucketTests.map(test => ({
        bucket: test.bucket,
        accessible: test.accessible
      }))
    });

  } catch (error) {
    console.error("Storage setup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check storage",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(bucket => ({
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        createdAt: bucket.created_at,
        updatedAt: bucket.updated_at
      }))
    });

  } catch (error) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get storage info",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
