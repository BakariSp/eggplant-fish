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

- **tag_pairs**
  - `id` UUID PK
  - `nfc_code` text UNIQUE            // NFC 标签中写入的唯一代码（URL 路径的一部分）
  - `qr_code` text UNIQUE             // 实物二维码打印的唯一代码（URL 路径的一部分）
  - `pet_id` UUID nullable FK -> pets.id
  - `is_claimed` bool                 // 是否已被认领（绑定到宠物）
  - `pair_code_hash` text             // 首次配对用一次性短码（显示 6 位，存储哈希）
  - `pair_code_expires_at` timestamptz
  - `claimed_at` timestamptz
  - `created_at` timestamptz

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
  /n/[code]/page.tsx            // 扫 NFC 唯一 URL 的入口（nfc_code）
  /q/[code]/page.tsx            // 扫 QR 唯一 URL 的入口（qr_code）
  /pair/page.tsx                // 首次配对与认领 UI（也可合并至 n/q 页面）
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
  pairCodes.ts                 // 将 nfc_code 与 qr_code 首次配对并认领
  verifyEditKey.ts
  createPost.ts
  updateProfile.ts
  toggleLostMode.ts
/lib/supabase.ts
/lib/auth.ts
```

---

## Key Flows

### NFC + QR 唯一码（首次配对与认领）
1. 生产阶段：
   - 每枚 NFC 标签写入 `https://<domain>/n/<nfc_code>`（唯一）。
   - 每枚二维码打印 `https://<domain>/q/<qr_code>`（唯一）。
   - 两者在出厂时可以“不配对”，数据库仅各自占位（`tag_pairs` 可先仅存其一）。

2. 首次使用（任一入口都可开始）：
   - 扫 NFC：`GET /n/<nfc_code>`
     - 若 `is_claimed = true` → 302 到 `/p/<slug>`。
     - 若未认领 → 生成一次性 `pair_code`（6 位，10 分钟有效，哈希入库），页面提示“请再扫二维码或在另一端输入配对码”。
   - 扫 QR：`GET /q/<qr_code>`
     - 若 `is_claimed = true` → 302 到 `/p/<slug>`。
     - 若未认领 → 若当前会话携带配对会话参数或输入 `pair_code` 成功，则将该 `qr_code` 与对应 `nfc_code` 形成一对（或单独绑定，允许缺一），进入认领流程。

3. 认领（Claim）：
   - 创建或选择宠物档案 `pets`，将 `tag_pairs.pet_id = pets.id`，`is_claimed = true`，记录 `claimed_at`。
   - 安全：沿用一次性 `edit_keys` 首绑烧毁的机制；或将 `pair_code` 仅作为短期会话验证，认领后立即失效。

4. 后续使用：
   - 扫 NFC 或扫 QR → 均直达 `/p/[slug]` 公共主页；Lost 模式按既有规则展示。

5. 转移（Transfer）：
   - 由当前主人在仪表盘发起解绑，清空 `pet_id`、重置 `is_claimed`，刷新 `pair_code`/`edit_key`，以便新主人重新认领。

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

