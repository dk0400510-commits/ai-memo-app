create extension if not exists pgcrypto;

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  category text not null default 'personal' check (
    category in ('personal', 'work', 'study', 'idea', 'other')
  ),
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists memos_user_created_at_idx
  on public.memos (user_id, created_at desc);

create index if not exists memos_tags_idx
  on public.memos using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_memos_updated_at on public.memos;
create trigger set_memos_updated_at
  before update on public.memos
  for each row
  execute function public.set_updated_at();

alter table public.memos enable row level security;

drop policy if exists "Users can view their own memos" on public.memos;
create policy "Users can view their own memos"
  on public.memos for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own memos" on public.memos;
create policy "Users can create their own memos"
  on public.memos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own memos" on public.memos;
create policy "Users can update their own memos"
  on public.memos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own memos" on public.memos;
create policy "Users can delete their own memos"
  on public.memos for delete
  to authenticated
  using ((select auth.uid()) = user_id);
