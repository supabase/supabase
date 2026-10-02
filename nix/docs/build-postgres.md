# 01 &mdash; Using supabase nix

Let's clone this repo:

```bash
git clone https://github.com/supabase/postgres $HOME/supabase-postgres
cd $HOME/supabase-postgres
```

## Hashes for everyone

But how do we build stuff within it? With `nix build`, of course! For example,
the following command will, when completed, create a symlink named `result` that
points to a path which contains an entire PostgreSQL 15 installation &mdash;
extensions and all:

```
nix build .#psql_15.bin
```

```
$ readlink result
/nix/store/zr238w2hwryn8dgs81l2p84clmrm36vx-postgresql-and-plugins-15.14
```

```
$ ls result
bin  include  lib  share
```

```
me@mek:~/supabase/postgres/ > ls -la result/bin/
...
dr-xr-xr-x  69 root  wheel  2208 Jan  1  1970 .
dr-xr-xr-x   7 root  wheel   224 Jan  1  1970 ..
lrwxr-xr-x   1 root  wheel    94 Jan  1  1970 .postgres-wrapped -> /nix/store/b1l8r414zsgsy78j63f0k6qb1wy0z8bf-postgresql-and-plugins-15.14/bin/.postgres-wrapped
lrwxr-xr-x   1 root  wheel    74 Jan  1  1970 clusterdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/clusterdb
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 createdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/createdb
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 createuser -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/createuser
lrwxr-xr-x   1 root  wheel    71 Jan  1  1970 dropdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/dropdb
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 dropuser -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/dropuser
lrwxr-xr-x   1 root  wheel    69 Jan  1  1970 ecpg -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/ecpg
lrwxr-xr-x   1 root  wheel    71 Jan  1  1970 initdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/initdb
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 oid2name -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/oid2name
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_amcheck -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_amcheck
lrwxr-xr-x   1 root  wheel    82 Jan  1  1970 pg_archivecleanup -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_archivecleanup
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 pg_basebackup -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_basebackup
lrwxr-xr-x   1 root  wheel    77 Jan  1  1970 pg_checksums -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_checksums
lrwxr-xr-x   1 root  wheel    86 Jan  1  1970 pg_config -> /nix/store/b1l8r414zsgsy78j63f0k6qb1wy0z8bf-postgresql-and-plugins-15.14/bin/pg_config
lrwxr-xr-x   1 root  wheel    79 Jan  1  1970 pg_controldata -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_controldata
lrwxr-xr-x   1 root  wheel    83 Jan  1  1970 pg_ctl -> /nix/store/b1l8r414zsgsy78j63f0k6qb1wy0z8bf-postgresql-and-plugins-15.14/bin/pg_ctl
lrwxr-xr-x   1 root  wheel    72 Jan  1  1970 pg_dump -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_dump
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_dumpall -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_dumpall
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_isready -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_isready
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 pg_receivewal -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_receivewal
lrwxr-xr-x   1 root  wheel    79 Jan  1  1970 pg_recvlogical -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_recvlogical
lrwxr-xr-x   1 root  wheel    67 Jan  1  1970 pg_repack -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/pg_repack
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 pg_repack-1.4.8 -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/pg_repack-1.4.8
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 pg_repack-1.5.0 -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/pg_repack-1.5.0
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 pg_repack-1.5.1 -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/pg_repack-1.5.1
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 pg_repack-1.5.2 -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/pg_repack-1.5.2
lrwxr-xr-x   1 root  wheel    76 Jan  1  1970 pg_resetwal -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_resetwal
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_restore -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_restore
lrwxr-xr-x   1 root  wheel    74 Jan  1  1970 pg_rewind -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_rewind
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 pg_test_fsync -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_test_fsync
lrwxr-xr-x   1 root  wheel    79 Jan  1  1970 pg_test_timing -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_test_timing
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_upgrade -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_upgrade
lrwxr-xr-x   1 root  wheel    80 Jan  1  1970 pg_verifybackup -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_verifybackup
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 pg_waldump -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pg_waldump
lrwxr-xr-x   1 root  wheel    72 Jan  1  1970 pgbench -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/pgbench
lrwxr-xr-x   1 root  wheel    85 Jan  1  1970 postgres -> /nix/store/b1l8r414zsgsy78j63f0k6qb1wy0z8bf-postgresql-and-plugins-15.14/bin/postgres
lrwxr-xr-x   1 root  wheel    75 Jan  1  1970 postmaster -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/postmaster
lrwxr-xr-x   1 root  wheel    69 Jan  1  1970 psql -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/psql
lrwxr-xr-x   1 root  wheel    74 Jan  1  1970 reindexdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/reindexdb
lrwxr-xr-x   1 root  wheel    72 Jan  1  1970 switch_http_version -> /nix/store/pf0595wpsqirk8vq3ph7m3nk6823idi9-http/bin/switch_http_version
lrwxr-xr-x   1 root  wheel    76 Jan  1  1970 switch_hypopg_version -> /nix/store/6qdjrmhfgdi5x99qs3m4pbwwhvv4dhs2-hypopg/bin/switch_hypopg_version
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 switch_pg_cron_version -> /nix/store/jal2054cvbkxv7kg8f0acz6nsik5ix4j-pg_cron/bin/switch_pg_cron_version
lrwxr-xr-x   1 root  wheel    84 Jan  1  1970 switch_pg_graphql_version -> /nix/store/nn5sccrdavpggyd933nhsfbhzirjk1py-pg_graphql/bin/switch_pg_graphql_version
lrwxr-xr-x   1 root  wheel    84 Jan  1  1970 switch_pg_hashids_version -> /nix/store/3i0wlm1n9s21375f49rs2wpnbgqw9v0i-pg_hashids/bin/switch_pg_hashids_version
lrwxr-xr-x   1 root  wheel    90 Jan  1  1970 switch_pg_jsonschema_version -> /nix/store/ap0vpxvrlhiy6w247kph2r3s6j6w67ff-pg_jsonschema/bin/switch_pg_jsonschema_version
lrwxr-xr-x   1 root  wheel    76 Jan  1  1970 switch_pg_net_version -> /nix/store/lf4pgs972ayzlr5kbwhv0945nvyhjnm9-pg_net/bin/switch_pg_net_version
lrwxr-xr-x   1 root  wheel    84 Jan  1  1970 switch_pg_partman_version -> /nix/store/wvv42m440a8kyjd109fkcnngh5qys14l-pg_partman/bin/switch_pg_partman_version
lrwxr-xr-x   1 root  wheel    82 Jan  1  1970 switch_pg_repack_version -> /nix/store/h2idx258zgrzfy458b71k1vl2pn78aqi-pg_repack/bin/switch_pg_repack_version
lrwxr-xr-x   1 root  wheel    94 Jan  1  1970 switch_pg_stat_monitor_version -> /nix/store/c8kaf0ngkhnmdfa4miqs32i8r75i3sfm-pg_stat_monitor/bin/switch_pg_stat_monitor_version
lrwxr-xr-x   1 root  wheel    76 Jan  1  1970 switch_pg_tle_version -> /nix/store/1w7bkj8296gjr7m7wjcaidkks14f58w1-pg_tle/bin/switch_pg_tle_version
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 switch_pgaudit_version -> /nix/store/s2pwg5g4avv8b8g66kwq6g9zqw9j6p5r-pgaudit/bin/switch_pgaudit_version
lrwxr-xr-x   1 root  wheel    80 Jan  1  1970 switch_pgroonga_version -> /nix/store/ww0yd2n8fahbh8mxkb90752l65zb658g-pgroonga/bin/switch_pgroonga_version
lrwxr-xr-x   1 root  wheel    82 Jan  1  1970 switch_pgrouting_version -> /nix/store/lq0nzykly53vlrc9vqiadjjgqdablhpg-pgrouting/bin/switch_pgrouting_version
lrwxr-xr-x   1 root  wheel    80 Jan  1  1970 switch_pgsodium_version -> /nix/store/smpbz1s6vpril625mg8wqbpqxnglzxhk-pgsodium/bin/switch_pgsodium_version
lrwxr-xr-x   1 root  wheel    74 Jan  1  1970 switch_pgtap_version -> /nix/store/w7j4r1jbj71444kc5c5wxswbc3br25cy-pgtap/bin/switch_pgtap_version
lrwxr-xr-x   1 root  wheel    86 Jan  1  1970 switch_plan_filter_version -> /nix/store/b6svdhdmyii9zm3iqa0avkma9km9lq7q-plan_filter/bin/switch_plan_filter_version
lrwxr-xr-x   1 root  wheel    90 Jan  1  1970 switch_plpgsql_check_version -> /nix/store/m5rlxi8d23fq68507warrmyiyi7vc1gn-plpgsql_check/bin/switch_plpgsql_check_version
lrwxr-xr-x   1 root  wheel    78 Jan  1  1970 switch_postgis_version -> /nix/store/f0y67gz0slgq0wnscsdl571485xm4j0g-postgis/bin/switch_postgis_version
lrwxr-xr-x   1 root  wheel    70 Jan  1  1970 switch_rum_version -> /nix/store/vwrmgxgvr75vrs42qck78k6xgfjvjlsb-rum/bin/switch_rum_version
lrwxr-xr-x   1 root  wheel    84 Jan  1  1970 switch_safeupdate_version -> /nix/store/0i1bln9zqwman76f18l8p5j3ph103jza-safeupdate/bin/switch_safeupdate_version
lrwxr-xr-x   1 root  wheel    92 Jan  1  1970 switch_supabase_vault_version -> /nix/store/bc4764di82vhi3njvaz5bzz3rwlixr6h-supabase_vault/bin/switch_supabase_vault_version
lrwxr-xr-x   1 root  wheel    86 Jan  1  1970 switch_timescaledb_version -> /nix/store/qdnc37agh9cndjmwxaca5wvg02l6g7y5-timescaledb/bin/switch_timescaledb_version
lrwxr-xr-x   1 root  wheel    76 Jan  1  1970 switch_vector_version -> /nix/store/c6x0xjyz16pv1gqqbarj7lma589hf9kf-vector/bin/switch_vector_version
lrwxr-xr-x   1 root  wheel    80 Jan  1  1970 switch_wal2json_version -> /nix/store/vi7kj1rwa16pj7akx9k97j4x8y0na0d6-wal2json/bin/switch_wal2json_version
lrwxr-xr-x   1 root  wheel    80 Jan  1  1970 switch_wrappers_version -> /nix/store/0jrx5wndh761rkvzjf4xpaka081zg9zd-wrappers/bin/switch_wrappers_version
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 vacuumdb -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/vacuumdb
lrwxr-xr-x   1 root  wheel    73 Jan  1  1970 vacuumlo -> /nix/store/8j8kr12mkvxy3jb9ydp6z812dqlf2y02-postgresql-15.14/bin/vacuumlo
```

As we can see, these files all point to paths under `/nix/store`. We're actually
looking at a "farm" of symlinks to various paths, but collectively they form an
entire installation directory we can reuse as much as we want.

The path
`/nix/store/zr238w2hwryn8dgs81l2p84clmrm36vx-postgresql-and-plugins-15.14`
ultimately is a cryptographically hashed, unique name for our installation of
PostgreSQL with those plugins. This hash includes _everything_ used to build it,
so even a single change anywhere to any extension or version would result in a
_new_ hash.

The ability to refer to a piece of data by its hash, by some notion of
_content_, is a very powerful primitive, as we'll see later.

## Build a different version: v17

What if we wanted PostgreSQL 17 and plugins? Just replace `_15` with `_17`:

```
nix build .#psql_17.bin
```

You're done:

```
$ readlink result
/nix/store/7pqfc0mirnihmnk9dfh1kq86js8pqlxq-postgresql-and-plugins-17.6
```


## Using `nix develop`


`nix develop .` will just drop you in a subshell with
tools you need _ready to go instantly_. That's all you need to do! And once that
shell goes away, nix installed tools will be removed from your `$PATH` as well.

There's an even easier way to do this
[that is completely transparent to you, as well](./use-direnv.md).
