-- Test the standard flow
select
  pgmq.create('Foo');

select
  *
from
  pgmq.send(
    queue_name:='Foo',
    msg:='{"foo": "bar1"}'
  );

-- Test queue is not case sensitive
select
  *
from
  pgmq.send(
    queue_name:='foo', -- note: lowercase useage
    msg:='{"foo": "bar2"}',
    delay:=5
  );

select
  msg_id,
  read_ct,
  message
from
  pgmq.read(
    queue_name:='Foo',
    vt:=30,
    qty:=2
  );

select
  msg_id,
  read_ct,
  message
from
  pgmq.pop('Foo');


-- Archive message with msg_id=2.
select
  pgmq.archive(
    queue_name:='Foo',
    msg_id:=2
  );


select
  pgmq.create('my_queue');

select
  pgmq.send_batch(
  queue_name:='my_queue',
  msgs:=array['{"foo": "bar3"}','{"foo": "bar4"}','{"foo": "bar5"}']::jsonb[]
);

select
  pgmq.archive(
    queue_name:='my_queue',
    msg_ids:=array[3, 4, 5]
  );

select
  pgmq.delete('my_queue', 6);


select
  pgmq.drop_queue('my_queue');

/*
-- Disabled until pg_partman goes back into the image
select
  pgmq.create_partitioned(
    'my_partitioned_queue',
    '5 seconds',
    '10 seconds'
);
*/


-- Make sure SQLI enabling characters are blocked
select pgmq.create('F--oo');
select pgmq.create('F$oo');
select pgmq.create($$F'oo$$);
\echo

-- pgmq schema functions with owners (ownership is modified on ansible/files/postgresql_extension_custom_scripts/pgmq/after-create.sql)
select
  n.nspname as schema_name,
  p.proname as function_name,
  r.rolname as owner
from
  pg_proc p
join
  pg_namespace n on p.pronamespace = n.oid
join
  pg_roles r on p.proowner = r.oid
where
  n.nspname = 'pgmq'
order by
  p.proname;

-- assert search_path is preserved after after-create script is run
show search_path;
