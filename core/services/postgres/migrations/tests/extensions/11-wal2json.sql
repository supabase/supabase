BEGIN;
select pg_drop_replication_slot(slot_name) from pg_replication_slots where slot_name = 'test_slot';
select * from pg_create_logical_replication_slot('test_slot', 'wal2json');
-- a rollback of the txn does not remove the logical replication slot that gets created, so we need to manually drop it
select pg_drop_replication_slot(slot_name) from pg_replication_slots where slot_name = 'test_slot';
ROLLBACK;
