alter table feedback
	add column user_id uuid default auth.uid(),
	add column title text,
	add column comment text;

create policy "Users can read their own feedback"
on feedback
as permissive for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own feedback"
on feedback
as permissive for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
