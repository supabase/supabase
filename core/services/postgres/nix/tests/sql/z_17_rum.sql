/*
This extension is excluded from oriole-17 because it uses an unsupported index type
*/
create schema v;

create table v.test_rum(
  t text,
  a tsvector
);

create trigger tsvectorupdate
  before update or insert on v.test_rum
  for each row
  execute procedure
    tsvector_update_trigger(
      'a',
      'pg_catalog.english',
      't'
    );

insert into v.test_rum(t)
values
  ('the situation is most beautiful'),
  ('it is a beautiful'),
  ('it looks like a beautiful place');

create index rumidx on v.test_rum using rum (a rum_tsvector_ops);

select
  t,
  round(a <=> to_tsquery('english', 'beautiful | place')) as rank
from
  v.test_rum
where
  a @@ to_tsquery('english', 'beautiful | place')
order by
  a <=> to_tsquery('english', 'beautiful | place');


drop schema v cascade;
