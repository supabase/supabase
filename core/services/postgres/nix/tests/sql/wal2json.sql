create schema v;

create table v.foo(
  id int primary key
);

select
  1
from
  pg_create_logical_replication_slot('reg_test', 'wal2json', false);

insert into v.foo(id) values (1);

select
  data
from
  pg_logical_slot_get_changes(
	'reg_test',
    null,
    null,
	'include-pk', 'true',
	'include-transaction', 'false',
	'include-timestamp', 'false',
	'include-type-oids', 'true',
	'format-version', '2',
	'actions', 'insert,update,delete',
	'add-tables', 'v.foo'
  ) x;

select
  pg_drop_replication_slot('reg_test');

drop schema v cascade;
