-- Note: there is no test that the logs were correctly output. Only checking for exceptions
set pgaudit.log = 'write, ddl';
set pgaudit.log_relation = on;
set pgaudit.log_level = notice;

create schema v;

create table v.account(
  id int,
  name text,
  password text,
  description text
);

insert into v.account (id, name, password, description)
values (1, 'user1', 'HASH1', 'blah, blah');

select
  *
from
  v.account;

drop schema v cascade;
