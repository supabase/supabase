create policy "Only admins should create a meetup"
on "public"."meetups"
as permissive
for insert
to service_role
with check (true);

create policy "Only admins should delete a meetup"
on "public"."meetups"
as permissive
for delete
to service_role
using (true);

create policy "Only admins should edit a meetup"
on "public"."meetups"
as permissive
for update
to service_role
using (true);