create schema v;

create table v.roon(
  id serial primary key,
  content text
);


with tokenizers as (
  select
    x
  from
    jsonb_array_elements(
      (select pgroonga_command('tokenizer_list'))::jsonb
    ) x(val)
  limit
    1
  offset
    1 -- first record is unrelated and not stable
)
select
  t.x::jsonb ->> 'name'
from
  jsonb_array_elements((select * from tokenizers)) t(x)
order by
  t.x::jsonb ->> 'name';


insert into v.roon (content)
values
  ('Hello World'),
  ('PostgreSQL with PGroonga is a thing'),
  ('This is a full-text search test'),
  ('PGroonga supports various languages');

-- Create default index
create index pgroonga_index on v.roon using pgroonga (content);

-- Create mecab tokenizer index since we had a bug with this one once
create index pgroonga_index_mecab on v.roon using pgroonga (content) with (tokenizer='TokenMecab');

-- Run some queries to test the index
select * from v.roon where content &@~ 'Hello';
select * from v.roon where content &@~ 'powerful';
select * from v.roon where content &@~ 'supports';


drop schema v cascade;
