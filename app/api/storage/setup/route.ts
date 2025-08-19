import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, getAdminSupabaseClient } from "../../../../lib/supabase";
import { STORAGE_BUCKETS } from "../../../../lib/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if the user-image bucket exists and is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return NextResponse.json({
        success: false,
        error: "Cannot access storage buckets",
        details: listError.message
      }, { status: 500 });
    }

    const userImageBucket = buckets?.find(b => b.id === "user-image");

    if (!userImageBucket) {
      return NextResponse.json({
        success: false,
        error: "user-image bucket not found",
        message: "Please create the 'user-image' bucket in your Supabase dashboard",
        instructions: [
          "1. Go to your Supabase dashboard",
          "2. Navigate to Storage",
          "3. The 'user-image' bucket should already exist",
          "4. Make sure it's set to public if you want public access"
        ]
      }, { status: 404 });
    }

    // Test upload permissions by trying to list files
    const { error: listFilesError } = await supabase.storage
      .from("user-image")
      .list("", { limit: 1 });

    return NextResponse.json({
      success: true,
      message: "Storage is ready to use",
      bucket: {
        id: userImageBucket.id,
        name: userImageBucket.name,
        public: userImageBucket.public,
        createdAt: userImageBucket.created_at
      },
      canAccess: !listFilesError,
      accessError: listFilesError?.message || null
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
