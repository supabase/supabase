create schema v;

create table v.samp(
  id int
);

select 1 from hypopg_create_index($$
  create index on v.samp(id)
$$);

drop schema v cascade;


