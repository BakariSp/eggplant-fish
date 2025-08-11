-- Enable RLS
alter table public.pets enable row level security;
alter table public.pet_posts enable row level security;
alter table public.pet_vaccinations enable row level security;
alter table public.contact_prefs enable row level security;
alter table public.edit_keys enable row level security;

-- Public can read limited pet fields and posts
create policy if not exists public_read_pets on public.pets
for select using (true);

create policy if not exists public_read_posts on public.pet_posts
for select using (true);

-- Owner can manage their own records
create policy if not exists owner_manage_pets on public.pets
for all using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy if not exists owner_manage_posts on public.pet_posts
for all using (
  exists(select 1 from public.pets p where p.id = pet_posts.pet_id and p.owner_user_id = auth.uid())
)
with check (
  exists(select 1 from public.pets p where p.id = pet_posts.pet_id and p.owner_user_id = auth.uid())
);

create policy if not exists owner_manage_vaccinations on public.pet_vaccinations
for all using (
  exists(select 1 from public.pets p where p.id = pet_vaccinations.pet_id and p.owner_user_id = auth.uid())
)
with check (
  exists(select 1 from public.pets p where p.id = pet_vaccinations.pet_id and p.owner_user_id = auth.uid())
);

create policy if not exists owner_manage_contact_prefs on public.contact_prefs
for all using (
  exists(select 1 from public.pets p where p.id = contact_prefs.pet_id and p.owner_user_id = auth.uid())
)
with check (
  exists(select 1 from public.pets p where p.id = contact_prefs.pet_id and p.owner_user_id = auth.uid())
);

-- edit_keys restricted: only service role should access; deny all to anon/auth
create policy if not exists no_select_edit_keys on public.edit_keys
for select using (false);
create policy if not exists no_modify_edit_keys on public.edit_keys
for all using (false) with check (false);

