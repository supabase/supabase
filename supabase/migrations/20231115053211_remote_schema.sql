alter table "public"."page" enable row level security;

alter table "public"."page_section" enable row level security;

create policy "Enable read access for anon and authenticated"
on "public"."page"
as permissive
for select
to anon, authenticated
using (true);

create policy "Enable read access for anon and authenticated"
on "public"."page_section"
as permissive
for select
to anon, authenticated
using (true);



