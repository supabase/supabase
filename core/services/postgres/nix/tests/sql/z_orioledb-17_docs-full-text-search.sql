-- testing sql found in https://supabase.com/docs/guides/database/full-text-search
create table books (
  id serial primary key,
  title text,
  author text,
  description text
);

insert into books
  (title, author, description)
values
  (
    'The Poky Little Puppy',
    'Janette Sebring Lowrey',
    'Puppy is slower than other, bigger animals.'
  ),
  ('The Tale of Peter Rabbit', 'Beatrix Potter', 'Rabbit eats some vegetables.'),
  ('Tootle', 'Gertrude Crampton', 'Little toy train has big dreams.'),
  (
    'Green Eggs and Ham',
    'Dr. Seuss',
    'Sam has changing food preferences and eats unusually colored food.'
  ),
  (
    'Harry Potter and the Goblet of Fire',
    'J.K. Rowling',
    'Fourth year of school starts, big drama ensues.'
  );

select to_tsvector('green eggs and ham');

select to_tsvector('english', 'green eggs and ham');

select *
from books
where title = 'Harry';

select *
from books
where to_tsvector(title) @@ to_tsquery('Harry');

select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('big');

select
  *
from
  books
where
  to_tsvector(description || ' ' || title)
  @@ to_tsquery('little');

create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;

select
  *
from
  books
where
  to_tsvector(title_description(books.*))
  @@ to_tsquery('little');

select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('little & big');

select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('little | big');

select title from books where to_tsvector(title) @@ to_tsquery('Lit:*');

create or replace function search_books_by_title_prefix(prefix text)
returns setof books AS $$
begin
  return query
  select * from books where to_tsvector('english', title) @@ to_tsquery(prefix || ':*');
end;
$$ language plpgsql;

select * from search_books_by_title_prefix('Lit');

select * from search_books_by_title_prefix('Little+Puppy');

alter table
  books
add column
  fts tsvector generated always as (to_tsvector('english', description || ' ' || title)) stored;

create index books_fts on books using gin (fts);

select id, fts
from books;

select
  *
from
  books
where
  fts @@ to_tsquery('little & big');

select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('big <-> dreams');

select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('year <2> school');

select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('big & !little');

select
  *
from
  books
where
  to_tsvector(title) @@ to_tsquery('harry & potter');

select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('food & !egg');

select
  *
from
  books
where
  to_tsvector(title || ' ' || description) @@ to_tsquery('train & toy');

select
  *
from
  books
where
  fts @@ to_tsquery('puppy & slow');

select
  *
from
  books
where
  fts @@ to_tsquery('rabbit | peter');

select
  *
from
  books
where
  fts @@ to_tsquery('harry <-> potter');

select
  *
from
  books
where
  fts @@ to_tsquery('fourth <3> year');

select
  *
from
  books
where
  fts @@ to_tsquery('big & !drama');

drop function search_books_by_title_prefix(text);
drop function title_description(books);
drop table books;
 