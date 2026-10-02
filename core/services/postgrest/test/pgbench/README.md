## pgbench tests

Can be used as:

```
postgrest-with-pg-15 -f test/pgbench/fixtures.sql pgbench -U postgres -n -T 10 -f test/pgbench/1567/old.sql

postgrest-with-pg-15 -f test/pgbench/fixtures.sql pgbench -U postgres -n -T 10 -f test/pgbench/1567/new.sql
```

## Directory structure

The directory name is the issue number on github.
