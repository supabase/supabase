## Running the server

If you want to run a postgres server, just do this from the root of the
repository:

```bash
nix run .#start-server 15
```

Replace the `15` with a `16`, and you'll be using a different version. Optionally you can specify a second argument for the port.

You likely have a running postgres, so to not cause a conflict, this uses port 5435 by default.

Actually, you don't even need the repository. You can do this from arbitrary
directories, if the left-hand side of the hash character (`.` in this case) is a
valid "flake reference":

```bash
# from any arbitrary directory
nix run github:supabase/postgres#start-server 15
```

### Arbitrary versions at arbitrary git revisions

Let's say you want to use a PostgreSQL build from a specific version of the
repository. You can change the syntax of the above to use _any_ version of the
repository, at any time, by adding the commit hash after the repository name:

```bash
# use postgresql 15 build at commit <some commit hash>
nix run github:supabase/postgres/<some commit hash>#start-server 15
```

## Running the client

All of the same rules apply, but try using `start-client` on the right-hand side
of the hash character, instead. For example:

```bash
nix run github:supabase/postgres#start-server 15 &
sleep 5
nix run github:supabase/postgres#start-client 16
```

## Running a server replica

To start a replica you can use the `start-postgres-replica` command.

- first argument: the master version
- second argument: the master port
- third argument: the replica server port

First start a server and a couple of replicas:

```bash
$ start-postgres-server 15 5435

$ start-postgres-replica 15 5439

$ start-postgres-replica 15 5440
```

Now check the master server:

```bash
$ start-postgres-client 15 5435
```

```sql
SELECT client_addr, state
FROM pg_stat_replication;
 client_addr |   state
-------------+-----------
 ::1         | streaming
 ::1         | streaming
(2 rows)

create table items as select x::int from generate_series(1,100) x;
```

And a replica:

```bash
$ start-postgres-client 15 5439
```

```sql
select count(*) from items;
 count
-------
   100
(1 row)
```
