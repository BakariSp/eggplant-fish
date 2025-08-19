# Supabase Storage Integration Guide

This guide will help you set up Supabase Storage for your Pet NFC App to handle image uploads and management.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and API keys

## Environment Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Finding Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Storage Buckets Setup

The app uses three storage buckets:

### 1. pet-avatars
- **Purpose**: Store pet profile pictures
- **Access**: Public
- **Size Limit**: 2MB
- **Allowed Types**: JPEG, PNG, WebP

### 2. pet-posts
- **Purpose**: Store images for pet posts/updates
- **Access**: Public
- **Size Limit**: 5MB
- **Allowed Types**: JPEG, PNG, WebP, GIF

### 3. user-uploads
- **Purpose**: General user uploads
- **Access**: Private
- **Size Limit**: 10MB
- **Allowed Types**: JPEG, PNG, WebP, GIF

## Automatic Setup

Run the storage setup API endpoint to create buckets automatically:

```bash
# Start your development server
npm run dev

# In another terminal, setup storage
curl -X POST http://localhost:3000/api/storage/setup
```

Or visit `http://localhost:3000/api/storage/setup` in your browser.

## Manual Setup

If automatic setup fails, create buckets manually:

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Click **Create Bucket** for each bucket:

### Creating pet-avatars bucket:
```sql
-- Bucket settings
Name: pet-avatars
Public: true
File size limit: 2097152 (2MB)
Allowed MIME types: image/jpeg,image/png,image/webp
```

### Creating pet-posts bucket:
```sql
-- Bucket settings
Name: pet-posts
Public: true
File size limit: 5242880 (5MB)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

### Creating user-uploads bucket:
```sql
-- Bucket settings
Name: user-uploads
Public: false
File size limit: 10485760 (10MB)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

## Usage Examples

### Basic Image Upload

```tsx
import { useImageUpload } from "../lib/hooks/useImageUpload";
import { getPetAvatarUploadOptions } from "../lib/storage";

function MyComponent() {
  const { upload, isUploading, error } = useImageUpload();

  const handleFileSelect = async (file: File) => {
    const result = await upload(file, getPetAvatarUploadOptions("pet-123"));
    
    if (result.success) {
      console.log("Image uploaded:", result.url);
    } else {
      console.error("Upload failed:", result.error);
    }
  };

  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      disabled={isUploading}
    />
  );
}
```

### Using PhotoUploader Component

```tsx
import PhotoUploader from "../components/PhotoUploader";
import { getPetPostUploadOptions } from "../lib/storage";

function PostCreator({ petId }: { petId: string }) {
  const handleUploadComplete = (result) => {
    if (result.success) {
      console.log("Image uploaded:", result.url);
      // Update your state or database
    }
  };

  return (
    <PhotoUploader
      uploadOptions={getPetPostUploadOptions(petId)}
      onUploadComplete={handleUploadComplete}
      multiple={true}
    />
  );
}
```

### Server-side Upload

```tsx
import { uploadImageAction } from "../server/actions/uploadImage";
import { getPetAvatarUploadOptions } from "../lib/storage";

async function handleServerUpload(formData: FormData) {
  "use server";
  
  const result = await uploadImageAction(
    formData, 
    getPetAvatarUploadOptions("pet-123")
  );
  
  return result;
}
```

## Storage Utilities

The app includes several utility functions:

### Upload Functions
- `uploadImage()` - Client-side upload
- `uploadImageServer()` - Server-side upload
- `uploadImageAction()` - Server action wrapper

### Management Functions
- `deleteImage()` - Delete an image
- `getSignedUrl()` - Get temporary URL for private images
- `listFiles()` - List files in a bucket

### Helper Functions
- `getPetAvatarUploadOptions()` - Get upload options for pet avatars
- `getPetPostUploadOptions()` - Get upload options for pet posts
- `extractPathFromUrl()` - Extract storage path from URL

## Security Considerations

### Row Level Security (RLS)

Add RLS policies to control access:

```sql
-- Allow users to upload to their pet's folder
CREATE POLICY "Users can upload to their pet folders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pet-avatars' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM pets WHERE owner_user_id = auth.uid()
  )
);

-- Allow users to read their pet images
CREATE POLICY "Users can view their pet images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pet-avatars' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM pets WHERE owner_user_id = auth.uid()
  )
);
```

### File Validation

The upload functions include built-in validation:
- File type checking
- File size limits
- Filename sanitization
- Unique filename generation

## Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Ensure `.env.local` has all required Supabase keys
   - Restart your development server after adding env vars

2. **"Bucket does not exist"**
   - Run the storage setup endpoint
   - Or create buckets manually in Supabase dashboard

3. **"Upload failed: Storage API not accessible"**
   - Check your Supabase project status
   - Verify API keys are correct
   - Ensure buckets are created

4. **"RLS policy violation"**
   - Add appropriate RLS policies
   - Or temporarily disable RLS for testing

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_STORAGE=true
```

## Performance Tips

1. **Image Optimization**
   - Resize images before upload
   - Use WebP format when possible
   - Implement client-side compression

2. **Caching**
   - Use CDN for public images
   - Implement browser caching headers
   - Consider image transformations

3. **Batch Uploads**
   - Upload multiple images in parallel
   - Show progress indicators
   - Handle failures gracefully

## Next Steps

1. Set up your Supabase project
2. Add environment variables
3. Run storage setup
4. Test image uploads
5. Add RLS policies
6. Integrate with your pet management features

For more advanced features, see the [Supabase Storage documentation](https://supabase.com/docs/guides/storage).
