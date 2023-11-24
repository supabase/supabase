alter table threads enable row level security;

create policy "authenticated users can view threads"
on threads for
select to authenticated using (true);

create policy "authenticated users can insert their own threads"
on threads for
insert to authenticated with check (auth.uid() = user_id);

create policy "authenticated users can update their own threads"
on threads for update to authenticated
using (auth.uid() = user_id);

create policy "authenticated users can delete their own threads"
on threads for delete
to authenticated
using (auth.uid() = user_id);
