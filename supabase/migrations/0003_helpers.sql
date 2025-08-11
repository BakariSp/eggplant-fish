-- Optional helper RPC to get current time
create or replace function public.now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

