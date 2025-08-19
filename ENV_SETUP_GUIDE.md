# Required Environment Variables for MVP

Create a .env.local file in your project root with these variables:

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# How to get these values:
# 1. Go to your Supabase project dashboard (https://supabase.com)
# 2. Navigate to Settings > API
# 3. Copy the following:
#    - Project URL → NEXT_PUBLIC_SUPABASE_URL
#    - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY  
#    - service_role key → SUPABASE_SERVICE_ROLE_KEY

# Next Steps:
# 1. Create .env.local with your Supabase credentials
# 2. Run migrations: npx supabase db push (if using Supabase CLI)
# 3. Or manually run the SQL in supabase/migrations/ in your Supabase dashboard
# 4. Test the login flow at http://localhost:3000/login
