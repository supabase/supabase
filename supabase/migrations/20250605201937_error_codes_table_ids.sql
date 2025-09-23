-- Add an ID column on the error table. It has a composite primary key but
-- needs an ID column to be able to use it as a foreign key.
alter table content.error
add column id uuid unique not null default gen_random_uuid();

grant select (id)
on content.error
to anon;

grant select (id)
on content.error
to authenticated;
