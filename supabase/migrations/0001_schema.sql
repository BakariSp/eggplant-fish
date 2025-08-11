create extension if not exists "uuid-ossp";

-- pets
create table if not exists public.pets (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text,
  breed text,
  birthdate date,
  avatar_url text,
  vaccinated boolean default false,
  allergy_note text,
  lost_mode boolean default false,
  lost_message text,
  lost_since timestamptz,
  owner_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- pet_posts
create table if not exists public.pet_posts (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  content text not null,
  images jsonb[],
  created_at timestamptz default now()
);

-- pet_vaccinations
create table if not exists public.pet_vaccinations (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_name text not null,
  date date not null,
  note text
);

-- edit_keys (server role only)
create table if not exists public.edit_keys (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  key_hash text not null,
  is_used boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- contact_prefs
create table if not exists public.contact_prefs (
  pet_id uuid primary key references public.pets(id) on delete cascade,
  show_phone boolean default false,
  phone text,
  show_email boolean default false,
  email text,
  show_sms boolean default false
);

