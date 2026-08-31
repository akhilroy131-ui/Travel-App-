-- Supabase project defaults may grant broad Data API privileges to anon and
-- authenticated. RLS remains the row filter, but least privilege requires explicit
-- table grants too.

begin;

revoke all on schema public from anon;
grant usage on schema public to authenticated;

revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.host_profiles to authenticated;
grant select, insert, update, delete on public.host_contacts to authenticated;
grant select, insert, update, delete on public.experiences to authenticated;
grant select, insert, delete on public.experience_photos to authenticated;
grant select, insert on public.bookings to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, update, delete on public.availability_rules to authenticated;
grant select, insert, update, delete on public.experience_availability to authenticated;
grant select, insert, delete on public.saved_experiences to authenticated;
grant select on public.contact_reveals to authenticated;

-- Functions are executable by PUBLIC unless explicitly revoked.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.generate_availability(uuid, date, date) to authenticated;
grant execute on function public.get_host_contact(uuid) to authenticated;
grant execute on function public.get_nearby_experiences(
  double precision, double precision, double precision
) to authenticated;
grant execute on function public.search_experiences(
  text, text, double precision, double precision, double precision,
  numeric, numeric, numeric, date, date, text, integer, integer
) to authenticated;

-- Keep future schema additions closed until a migration makes their API surface explicit.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;

commit;
