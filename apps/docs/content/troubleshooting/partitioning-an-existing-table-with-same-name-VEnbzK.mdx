---
title = "Partitioning an existing table with same name"
github_url = "https://github.com/orgs/supabase/discussions/21380"
date_created = "2024-02-20T08:39:24+00:00"
topics = [ "database" ]
keywords = [ "partitioning", "table", "postgresql", "constraint", "index" ]
database_id = "3142f418-028e-4ab1-8f82-a7096be90422"
---

Our documentation on table partitioning here: https://supabase.com/docs/guides/database/partitions

Read the below information if you want the partitioned table to retain the name of the original table.

- You can create empty "parent" partitioned table using CREATE TABLE parent_table LIKE source_table [ like_option ... ] PARTITION BY ...

LIKE option will copy column definitions, constraints etc. from source table automatically. For different like_options see https://www.postgresql.org/docs/current/sql-createtable.html (you could try INCLUDING ALL like option).

- Then you can create empty partitions for ranges that you like.

- Then you could insert rows from the old/original table into parent_table. They will be spread into partitions at almost no cost. But the process could take time. For experiment, you could insert a subset from original table (using `ORDER BY id LIMIT <number>` clause) and see time needed to do actual work.

- It's crucial to check that you haven't forgotten some range by checking default partition (that contains rows inserted into a parent table but not corresponding any partition ranges) meanwhile. Overgrown default partition slows down almost any operations with partitioned table.

- When insert is finished you can rename old and new "parent" table. Do it in one transaction, so that you have no time old name is already don't exist but not yet re-created for any query.

- Indices definition will be copied with INCLUDING ALL option. They will be propagated during insertion of data into a new parent table.

- Of course you can hold old table for your data to be safe indefinitely. Do not delete it outright! Your queries after renaming will not use it. Indexes etc. work behind the scenes, you are not required to know its names. (In reality indices for a "new" partitioned table will be new, but you won't see it if you have used `LIKE..INCLUDING ALL` option).

- Triggers will be needed to re-create for "parent" partitioned table using `CREATE TRIGGER` clause https://www.postgresql.org/docs/16/sql-createtrigger.html

- Functions will switch to work with a new table after renaming.

- There are certain limitations of declarative partitioning that you may need to be aware: https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-DECLARATIVE
