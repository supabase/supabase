load 'safeupdate';

set safeupdate.enabled=1;

create schema v;

create table v.foo(
  id int,
  val text
);

update v.foo
  set val = 'bar';

drop schema v cascade;
