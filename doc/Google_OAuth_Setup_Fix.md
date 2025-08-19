# Google OAuth Configuration Fix

## Issues Identified

1. ✅ **FIXED**: `TypeError: Cannot read properties of undefined (reading 'getUser')` 
   - **Cause**: Missing `await` keyword for `getServerSupabaseClient()` in `app/dashboard/pets/page.tsx`
   - **Solution**: Added `await` to properly handle the async function

2. ❌ **PENDING**: Google OAuth error - "Unable to exchange external code"
   - **Cause**: Incorrect Google OAuth configuration in Supabase
   - **Solution**: Follow the setup guide below

## Google OAuth Setup Guide

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - For local development, also add:
     ```
     http://localhost:54321/auth/v1/callback
     ```

### Step 2: Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and click to configure
4. Enable the Google provider
5. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
6. Save the configuration

### Step 3: Environment Variables

Ensure your `.env.local` file has the correct Supabase configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 4: Update Redirect URLs

The current redirect URL in the code is:
```typescript
redirectTo: `${window.location.origin}/dashboard/pets`
```

For production, make sure your domain is added to:
1. **Google Cloud Console**: Authorized JavaScript origins and redirect URIs
2. **Supabase**: Site URL in Authentication settings

### Step 5: Common Issues & Solutions

#### Issue: "Unable to exchange external code"
**Causes:**
- Incorrect Client ID/Secret in Supabase
- Missing redirect URI in Google Cloud Console
- Mismatched domains between Google and Supabase

**Solutions:**
1. Double-check Client ID and Secret are correctly copied
2. Ensure redirect URI exactly matches: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Verify your Supabase project URL is correct

#### Issue: "redirect_uri_mismatch"
**Solution:** Add all possible redirect URIs to Google Cloud Console:
```
https://your-project-ref.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
https://yourdomain.com (for production)
```

#### Issue: "access_denied"
**Solution:** Check Google OAuth consent screen configuration and ensure it's published for production use.

### Step 6: Testing

1. Clear browser cache and cookies
2. Try the OAuth flow again
3. Check browser developer tools for any console errors
4. Monitor Supabase logs in the dashboard

### Step 7: Production Considerations

For production deployment:
1. Update Google Cloud Console with your production domain
2. Update Supabase Site URL setting
3. Ensure HTTPS is enabled
4. Test the complete flow in production environment

## Verification Steps

After completing the setup:

1. ✅ Server-side authentication error is fixed
2. ✅ Environment variables are configured
3. ✅ Google Cloud Console is set up
4. ✅ Supabase Google provider is enabled
5. ✅ Redirect URIs match exactly
6. ✅ OAuth flow completes successfully

## Next Steps

1. Complete the Google OAuth setup in Supabase dashboard
2. Test the authentication flow
3. Monitor for any remaining errors
4. Consider adding error handling for OAuth failures

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
