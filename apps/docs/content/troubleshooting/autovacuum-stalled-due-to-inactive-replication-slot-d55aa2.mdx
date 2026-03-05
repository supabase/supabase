---
title = "Autovacuum Stalled Due to Inactive Replication Slot"
topics = [ "database" ]
keywords = []
database_id = "a931b8af-3210-4188-bb03-87452923a498"
---

If you observe that `supabase inspect db vacuum-stats` reports "Expect autovacuum? yes" for your tables, but autovacuum activity has been inactive for an extended period, leading to increasing database RAM usage, this typically indicates a stalled autovacuum process. One of the reasons for autovacuum to get stalled is an inactive replication slot for which this guide talks about.

## Why does this happen?

Replication slots (logical or physical) tell Postgres “don’t remove WAL or older transaction state before this point” because a consumer/replica might still need those WAL records or visibility information. That means autovacuum will get slower, do more work, or appear to be stalled because it can't progress past the older snapshot anchored by the slot. Inactive logical replication slots can prevent the autovacuum process from running effectively. This stall prevents the cleanup of dead tuples, leading to database bloat and increased resource consumption.

## How to resolve this issue

1.  **Identify inactive replication slots:**
    Execute the following query in your [SQL editor](/dashboard/project/_/sql/new) to list all replication slots and their activity status:
    ```sql
    select slot_name, slot_type, active, active_pid from pg_replication_slots where active is false;
    ```
2.  **Drop inactive slot(s):**
    For each `slot_name` identified as `active = f` (inactive), execute the following command. Replace `'slot_name'` with the actual name of the inactive slot (e.g., `'example_slot'`):
    ```sql
    select pg_drop_replication_slot('slot_name');
    ```
3.  **Confirm removal:**
    Re-run the identification query from step 1 to verify that the inactive slot(s) have been successfully removed. Once removed, autovacuum should resume normal operation.
