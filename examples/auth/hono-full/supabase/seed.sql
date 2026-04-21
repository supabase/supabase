-- Create the table
create table countries (
  id bigint primary key generated always as identity,
  name text not null
);
-- Insert some sample data into the table
insert into countries (name)
values
  ('Canada'),
  ('United States'),
  ('Mexico');

alter table countries enable row level security;

-- Create a policy that allows authenticated users to read countries
create policy "authenticated users can read countries"
on public.countries
for select to authenticated
using (true);