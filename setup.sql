-- Run once in the Supabase SQL editor. Create the couple's Auth accounts first,
-- then add their user UUIDs to public.owners using Table Editor.
create table public.owners (id uuid primary key references auth.users(id) on delete cascade);
alter table public.owners enable row level security;
create policy "Owners see their own membership" on public.owners for select to authenticated using (id = auth.uid());
create function public.is_wedding_owner() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.owners where id=auth.uid()); $$;
revoke all on function public.is_wedding_owner() from public;
grant execute on function public.is_wedding_owner() to anon, authenticated;
create table public.photos (
 id uuid primary key default gen_random_uuid(), path text not null unique,
 caption text not null check(length(trim(caption)) between 1 and 200),
 created_at timestamptz not null default now()
);
alter table public.photos enable row level security;
create policy "Everyone can see photos" on public.photos for select using (true);
create policy "Couple manage photos" on public.photos for all to authenticated using (public.is_wedding_owner()) with check (public.is_wedding_owner());
create table public.notes (
 id uuid primary key default gen_random_uuid(),
 photo_id uuid references public.photos(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80),
 message text not null check(length(trim(message)) between 1 and 1500),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "Public approved notes and owner review" on public.notes for select using (approved or public.is_wedding_owner());
create policy "Visitors submit pending notes" on public.notes for insert to anon, authenticated with check (approved = false);
create policy "Couple moderate" on public.notes for update to authenticated using (public.is_wedding_owner()) with check (public.is_wedding_owner());
create policy "Couple delete notes" on public.notes for delete to authenticated using (public.is_wedding_owner());
grant select on public.owners to authenticated;
grant select on public.photos to anon, authenticated;
grant insert,update,delete on public.photos to authenticated;
grant select,insert on public.notes to anon, authenticated;
grant update,delete on public.notes to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('wedding-photos','wedding-photos',true,10485760,array['image/jpeg','image/png','image/webp']);
create policy "Public wedding album" on storage.objects for select using (bucket_id='wedding-photos');
create policy "Couple upload" on storage.objects for insert to authenticated with check (bucket_id='wedding-photos' and public.is_wedding_owner());
create policy "Couple remove uploads" on storage.objects for delete to authenticated using (bucket_id='wedding-photos' and public.is_wedding_owner());
