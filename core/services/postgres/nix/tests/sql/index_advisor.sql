create schema v;

create table v.book(
  id int primary key,
  title text not null
);

select
  index_statements, errors
from
  index_advisor('select id from v.book where title = $1');

drop schema v cascade;
