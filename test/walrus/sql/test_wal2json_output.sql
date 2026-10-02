select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

begin;
    insert into public.notes(id, body) values (1, 'hello');
    update public.notes set body = 'world';
    delete from public.notes;
end;

select
    jsonb_pretty(norm(x.data::jsonb))
from
    pg_logical_slot_get_changes(
        'realtime', null, null,
        'include-pk', '1',
        'include-transaction', 'false',
        'include-timestamp', 'true',
        'include-type-oids', 'true',
        'format-version', '2',
        'actions', 'insert,update,delete',
        'add-tables', 'public.notes'
    ) x;

select pg_drop_replication_slot('realtime');
drop table public.notes;
truncate table realtime.subscription;
