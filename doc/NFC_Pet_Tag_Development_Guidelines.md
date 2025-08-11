# NFC Pet Tag Web Platform – Development Guidelines

## Tech Stack
- **Frontend**: Next.js (App Router) hosted on Vercel
- **Backend / DB**: Supabase (PostgreSQL + Storage + RLS)
- **Auth**: Supabase Auth (Email Magic Link)
- **Storage**: Supabase Buckets for images (avatars, blog photos)
- **Deployment**: Vercel for frontend, Supabase for backend

---

## Features Overview

### Public
- Scan NFC tag or QR → `/p/[slug]` profile page
- Shows pet info, vaccination record, pet blog posts
- If Lost Mode is ON: sticky alert banner + contact buttons
- Mobile-first, fast loading

### Private (Owner Dashboard)
- Authenticated via Magic Link
- Edit pet info (name, breed, birthdate, avatar, notes, vaccinations)
- Manage blog posts (text + up to 3 photos per post)
- Toggle Lost Mode and set lost message
- Manage contact preferences

### Registration Card
- QR to `/setup?pid=<slug>`
- One-time Edit Key
- First use → create owner account or temp session → burn key

---

## Database Schema (Supabase)

### Tables
- **pets**
  - `id` UUID PK
  - `slug` text UNIQUE
  - `name` text
  - `breed` text
  - `birthdate` date
  - `avatar_url` text
  - `vaccinated` bool
  - `allergy_note` text
  - `lost_mode` bool
  - `lost_message` text
  - `lost_since` timestamptz
  - `owner_user_id` UUID FK -> auth.users
  - `created_at` timestamptz
- **pet_posts**
  - `id` UUID PK
  - `pet_id` FK -> pets.id
  - `content` text
  - `images` jsonb[]
  - `created_at` timestamptz
- **pet_vaccinations**
  - `id` UUID PK
  - `pet_id` FK -> pets.id
  - `vaccine_name` text
  - `date` date
  - `note` text
- **edit_keys**
  - `id` UUID PK
  - `pet_id` FK -> pets.id
  - `key_hash` text
  - `is_used` bool
  - `expires_at` timestamptz
  - `created_at` timestamptz
- **contact_prefs**
  - `pet_id` FK -> pets.id
  - `show_phone` bool
  - `phone` text
  - `show_email` bool
  - `email` text
  - `show_sms` bool

### Storage Buckets
- `pet-avatars/`
- `pet-posts/`

---

## RLS Rules
- Public can read `pets` (selected fields) & `pet_posts` for profiles in Lost/Normal mode
- Only owner can insert/update/delete their `pets`, `pet_posts`, `pet_vaccinations`, `contact_prefs`
- `edit_keys` accessible only via server role

---

## Next.js Structure

```
/app
  /p/[slug]/page.tsx           // Public profile
  /setup/page.tsx              // Edit Key setup flow
  /dashboard
    /pets/[id]/page.tsx        // Edit pet profile
    /pets/[id]/posts           // CRUD blog posts
/components
  PetHeader.tsx
  LostAlert.tsx
  PostCard.tsx
  VaccinationList.tsx
  PhotoUploader.tsx
  LostModeToggle.tsx
/server/actions
  verifyEditKey.ts
  createPost.ts
  updateProfile.ts
  toggleLostMode.ts
/lib/supabase.ts
/lib/auth.ts
```

---

## Key Flows

### First-Time Setup
1. Scan QR → `/setup?pid=<slug>`
2. Enter Edit Key → verify → temp session → burn key
3. Complete profile setup → optional auth link for future edits

### Editing (Owner)
1. Login → `/dashboard/pets/:id`
2. Edit details, blog, contact prefs, Lost Mode toggle

### Lost Mode
- Toggle ON → set `lost_mode = true`, `lost_since = now()`
- Public page shows red alert banner + contact actions

---

## Milestones

**Day 1–2**: DB schema, RLS, storage buckets, profile skeleton, Lost banner  
**Day 3–4**: Setup flow + Edit Key burn, auth, dashboard shell  
**Day 5–6**: Blog CRUD, uploads, vaccinations  
**Day 7**: Mobile UX, error states, analytics

---

## Acceptance Criteria
- Public profile loads <2.5s P95 on 4G
- Lost Mode shows correct alert + contact
- Edit Key burns after first use
- Owners manage blogs & profile securely
- RLS prevents unauthorized edits

