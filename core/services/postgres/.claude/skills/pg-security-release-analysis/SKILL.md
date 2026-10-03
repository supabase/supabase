---
name: pg-security-release-analysis
description: Generate a CVE catalog + Supabase impact analysis for a PostgreSQL security release. Use when reviewing a new upstream PG quarterly security release to decide what to ship and how to communicate. Inputs are the version ranges (e.g. REL_15_14..REL_15_18 + REL_17_6..REL_17_10); output is a draft catalog markdown ready to post on the breaking-change-analysis Linear ticket.
---

You help the Supabase Postgres team analyze upstream PG security releases. The goal is to convert "PG just shipped a new minor security release" into a complete, verifiable catalog of (a) every customer-affecting change (CVE and non-CVE), (b) the Supabase surface area it touches, and (c) what we need to communicate. Worked example: [PSQL-1110](https://linear.app/supabase/issue/PSQL-1110) (May 2026 cycle).

## Inputs

If not provided, ask the user for the upstream PG version ranges to analyze. Typically:

- `pg15_from`..`pg15_to` (e.g. `REL_15_14..REL_15_18`)
- `pg17_from`..`pg17_to` (e.g. `REL_17_6..REL_17_10`)

For each branch, the `from` version is what's currently in `nix/config.nix`; the `to` version is the target.

## Critical universal gotchas (apply to every cycle)

1. **`git log --grep` does not tell you "first landed in version X."** Use `git tag --contains <sha> | grep -E '^REL_(15|17)_' | sort -V | head -1`.
2. **CVSS in commit messages diverges from the canonical security page.** Always cross-check against `https://www.postgresql.org/support/security/`. The May 2026 cycle had 5 misclassified severities on first pass.
3. **CVE refs in "Last-minute updates for release notes" commits aren't backports.** Verify each CVE has at least one real fix commit, not just a release-notes-update reference. PG-18-only CVEs leak through this way (e.g. CVE-2026-2007 in May 2026).
4. **`--grep=CVE` alone misses everything that wasn't tagged with a CVE.** The Pattern Matrix below is mandatory — walk it in full, every cycle, regardless of CVE count.
5. **"No CVE in this area" ≠ "no impact."** Non-CVE bug fixes can have larger customer impact than CVEs (e.g. the May 2026 ltree REINDEX issue affected more projects than any single CVE).

## Workflow

### Step 1 — Set up the upstream postgres clone

Cache at `/tmp/postgres-upstream` so subsequent runs reuse it.

```bash
if [ ! -d /tmp/postgres-upstream ]; then
  git clone --filter=blob:none --no-checkout https://github.com/postgres/postgres.git /tmp/postgres-upstream
fi
git -C /tmp/postgres-upstream fetch --depth=600 origin \
  refs/tags/<pg15_from>:refs/tags/<pg15_from> \
  refs/tags/<pg15_to>:refs/tags/<pg15_to> \
  refs/tags/<pg17_from>:refs/tags/<pg17_from> \
  refs/tags/<pg17_to>:refs/tags/<pg17_to>
```

Verify: `git -C /tmp/postgres-upstream tag --list 'REL_1[57]_*' | sort -V`.

### Step 2 — Enumerate CVEs and verify they're actually backported

```bash
git -C /tmp/postgres-upstream log <pg15_from>..<pg15_to> --format=%B | grep -oE 'CVE-[0-9]{4}-[0-9]+' | sort -u
git -C /tmp/postgres-upstream log <pg17_from>..<pg17_to> --format=%B | grep -oE 'CVE-[0-9]{4}-[0-9]+' | sort -u
```

For each CVE in either list, run `git log <range> --grep='CVE-XXXX-YYYY' --format='%h %s'` and confirm at least one commit is a real fix (subject line is not "Last-minute updates for release notes").

### Step 3 — Cross-verify severity against the canonical security page

Fetch `https://www.postgresql.org/support/security/`. For every in-scope CVE, capture:

- CVSS score
- Severity label (CVSS ≥ 7.0 = High, 4.0–6.9 = Medium, < 4.0 = Low — verify label matches CVSS band)
- Affected versions
- Fixed-in versions

### Step 4 — Map each CVE to its fix commits and first-landed version

For each in-scope CVE:

```bash
git -C /tmp/postgres-upstream log <range> --grep='CVE-XXXX-YYYY' --format='%h %s'
git -C /tmp/postgres-upstream tag --contains <fix-sha> | grep -E '^REL_(15|17)_' | sort -V | head -1
```

### Step 5 — Walk the Pattern Matrix (the comprehensive part)

For **every release**, walk through the matrix below. For each class, run the detection command, read what comes back, and answer the Supabase-impact question. Do NOT skip classes that "feel unlikely" — the whole point is to catch the surprise.

(Matrix is its own section below — see [Pattern Matrix](#pattern-matrix).)

### Step 6 — Cross-check against the Supabase Surface Map

For every finding from Step 5, ask: which piece of the Supabase Surface Map does it touch? If none, the risk is bounded. If one or more, document the customer-impact path explicitly.

(Surface map is its own section below — see [Supabase Surface Map](#supabase-surface-map).)

### Step 7 — Generate the catalog draft

Output a markdown catalog matching [PSQL-1110](https://linear.app/supabase/issue/PSQL-1110)'s comment structure. Sections:

1. **Top-of-document context**: how many upstream cycles bundled, total CVE count, severity rollup
2. **⚠ Highest-impact item callout** (most customer-affecting non-CVE or CVE)
3. **A. CVE table**, sorted High → Medium → Low. Columns: `#`, `CVE`, `Severity (CVSS)`, `First landed in`, `Affected component`, `Upstream fix (15.x)` (linked sha), `Upstream fix (17.x)` (linked sha), `Supabase impact`, `Mitigation / action`
4. **Out of scope** (PG 18-only CVEs)
5. **PG-major-version-only ABI concerns** (if any)
6. **C. Non-CVE behavior changes** (table, customer-visible only)
7. **D. Fleet detection queries** (SQL the support team / data-eng can run)
8. **E. Action items** (Phase 0–5 of the breaking-change rollout)
9. **F. Reproducing this analysis** (the commands used)

Commit-link format: `[<8-char-sha>](https://github.com/postgres/postgres/commit/<sha>)`.

---

## Pattern Matrix

Walk every class for every release. Detection commands assume `git -C /tmp/postgres-upstream` and `<range>` = the version range (e.g. `REL_15_14..REL_15_18`).

### 1. Privilege / auth tightenings

**What it looks like**: new `superuser()` checks, new `pg_*_aclcheck` / `object_aclcheck` calls, default role privilege changes.

**Detection**:
```bash
git log <range> --oneline -- src/backend/commands/ src/backend/catalog/ | grep -iE 'privilege|aclcheck|superuser'
git log <range> -p -- src/backend/commands/ | grep -nE '^\+.*\b(superuser\(\)|pg_proc_aclcheck|object_aclcheck)' | head -40
```

**Supabase impact questions**: Customer roles (`postgres`, `anon`, `authenticated`, `service_role`, `supabase_admin_lite`) are non-superuser. Which of the new checks do they trip? Does the trip happen at runtime, at dump/restore time, or at `pg_upgrade`? Are any default-installed extensions affected?

**Historical example**: CVE-2026-2004 (May 2026) — superuser required for non-built-in selectivity estimators on operators. Fired at `pg_dump` / `pg_restore` / `pg_upgrade` time, not runtime.

### 2. Silent data correctness

**What it looks like**: multibyte / locale / collation / case-folding fixes, comparison function fixes, index correctness fixes (GiST / GIN / B-tree / BRIN). Failures are typically SILENT — wrong query results, not errors.

**Detection**:
```bash
git log <range> --oneline -- src/backend/utils/ src/backend/access/ contrib/ | grep -iE 'multibyte|collation|locale|case[- ]?fold|comparison|overflow|truncat'
git log <range> --oneline -- contrib/ | grep -iE 'fix|wrong|incorrect' | grep -viE 'test|comment|typo|docs?|format'
```

**Supabase impact questions**: Does this require REINDEX on existing indexes? Which encodings / collation providers (libc vs ICU) are affected? Which Supabase-shipped extensions touch this code path? Is the failure mode silent (wrong results) or noisy (error)? If silent, it warrants headline customer comms.

**Historical example**: ltree multibyte case-folding fix (May 2026 cycle) — required REINDEX on UTF-8 / ICU databases; ~2,245 projects affected.

### 3. Memory safety / buffer overrun

**What it looks like**: `palloc` / `alloc` overflow fixes, bounds-check additions, length validation in parsers.

**Detection**:
```bash
git log <range> --oneline | grep -iE 'overflow|palloc|bound|overrun|MaxAllocSize|integer overflow'
git log <range> --oneline -- src/backend/utils/mb/ src/backend/utils/adt/ | grep -iE 'overflow|length'
```

**Supabase impact questions**: Was the bug exploitable by an authenticated customer with crafted input? Does the affected code path get exercised by default-shipped extensions (pgcrypto, pg_trgm, intarray, ltree) or RLS-policy expressions?

### 4. SQL injection / quoting / escaping

**What it looks like**: fixes in `pg_dump` output formatting, dynamic SQL inside contrib modules, identifier quoting bugs.

**Detection**:
```bash
git log <range> --oneline | grep -iE 'quot|escape|inject|sql.+inject'
git log <range> --oneline -- src/bin/pg_dump/ contrib/ | grep -iE 'quot|escape'
```

**Supabase impact questions**: Does the affected tool (pg_dump, pg_restore, or a contrib module) run with elevated privileges in any Supabase flow (logical backup, project clone, wal-g)? Are customer-supplied identifiers (table names, role names) ever interpolated unsafely?

**Historical example**: CVE-2026-6637 (May 2026) — refint `check_foreign_key()` SQL injection. refint not default-enabled at Supabase but available via `CREATE EXTENSION`.

### 5. Tool-side fixes (Supabase infra binaries)

**What it looks like**: bug fixes in `pg_basebackup`, `pg_rewind`, `pg_dump`, `pg_restore`, `pg_upgrade`, `pg_createsubscriber`, `pg_verifybackup`, `pg_combinebackup`, `libpq`, `psql`, `ecpg`.

**Detection**:
```bash
git log <range> --oneline -- src/bin/ src/interfaces/libpq/
```

**Supabase impact questions**: Which Supabase services use this binary?
- `pg_basebackup` → wal-g PITR pipeline
- `libpq` → bundled in AMI, used by psql / pgbouncer / PostgREST / GoTrue connection paths
- `pg_dump` / `pg_restore` → dashboard "Clone Project" flow, logical backups
- `pg_upgrade` → dashboard version-upgrade flow
- `pg_createsubscriber` → grep `supabase/postgres` for usage; PG 17+ only

For each binary, also check: does Supabase pin the version, or does it pick up whatever ships with the new minor?

**Historical example**: CVE-2026-6475 (May 2026) — `pg_basebackup` / `pg_rewind` path traversal. wal-g uses `pg_basebackup` (verified in `ansible/tasks/setup-wal-g.yml`).

### 6. ABI / API breaks (affect compiled extensions)

**What it looks like**: changes to struct layouts, enum value ordering, function signatures, or header definitions in `src/include/`.

**Detection**:
```bash
git log <range> --oneline -- src/include/ | head -40
git diff <pg17_from>..<pg17_to> -- src/include/ | grep -E '^-[^-].*\b(struct|enum|typedef|extern)' | head -40
git log <range> --oneline | grep -iE 'ABI|API|signature|enum.+order'
```

**Supabase impact questions**: All extensions in `nix/ext/` rebuild from source via nix, so internal ABI shifts don't affect them. **But**: customer-supplied / non-nix-built C extensions could break. Is any third-party C extension whitelisted today?

**Historical example**: `ProcSignalReason` enum ordering restored in PG 17.x (commit `586f4266`) — would have broken any C extension that read enum values out of position.

### 7. Plan / selectivity / statistics changes

**What it looks like**: planner optimization fixes, statistics gathering changes, selectivity estimator updates, cost-estimation fixes, memoization fixes.

**Detection**:
```bash
git log <range> --oneline -- src/backend/optimizer/ src/backend/utils/adt/selfuncs.c src/backend/statistics/ | head -40
git log <range> --oneline -- contrib/ | grep -iE 'selectivity|estimate|stat|plan'
```

**Supabase impact questions**: Could query plans shift for existing customers? Are statistics rebuild (`ANALYZE`) or REINDEX required for the fix to take effect? Are there cost regressions on common Supabase query shapes (RLS-heavy, JSON path expressions, full-text search)?

**Historical example**: `c89510431a` (May 2026) — intarray selectivity estimation overflow near `INT_MAX`. Wrong plans for intarray-heavy workloads.

### 8. Default / config / GUC behavior shifts

**What it looks like**: changes to default GUC values, `postgresql.conf.sample`, parameter renames, deprecations.

**Detection**:
```bash
git log <range> --oneline -- src/backend/utils/misc/postgresql.conf.sample src/backend/utils/misc/guc_tables.c
git diff <range> -- src/backend/utils/misc/postgresql.conf.sample | head -100
git log <range> --oneline | grep -iE 'default.+value|GUC|setting'
```

**Supabase impact questions**: Does Supabase already override this GUC in `ansible/files/postgresql_config/postgresql.conf.j2`? If not, does the new default affect anything customers depend on (logging verbosity, timeouts, connection limits, replication, SSL params)?

### 9. Replication / WAL behavior

**What it looks like**: walsender / walreceiver fixes, logical replication (subscriptions, publications, slotsync), WAL format changes, recovery / checkpoint fixes, FSM/VM persistence.

**Detection**:
```bash
git log <range> --oneline -- src/backend/replication/ src/backend/access/transam/ | head -40
git log <range> --oneline | grep -iE 'walsender|walreceiver|slotsync|publication|subscription|recovery|checkpoint|WAL'
```

**Supabase impact questions**:
- Realtime depends on logical replication (`pgoutput` decoder + publications). Any change to publication catalog, REFRESH PUBLICATION, or decoding behavior?
- wal-g depends on physical replication / WAL streaming. Any change to WAL format or basebackup?
- Read replicas (where Supabase offers them) depend on streaming replication.
- Customer-managed logical subscribers (rare but exists).

**Historical example**: PG 17.10 fixed walsender shutdown hang, slotsync workers blocking standby promotion. Both affect production-cluster behavior.

### 10. Authentication / TLS / password handling

**What it looks like**: SCRAM / GSS / SSL handshake fixes, certificate handling, password hashing (MD5, SCRAM-SHA-256), timing-safe comparisons.

**Detection**:
```bash
git log <range> --oneline -- src/backend/libpq/ src/backend/utils/adt/cryptohashes.c | head -40
git log <range> --oneline | grep -iE 'SCRAM|GSS|SSL|TLS|password|hash|cert|auth'
```

**Supabase impact questions**: Default auth method on Supabase is SCRAM-SHA-256 (verify in `ansible/files/postgresql_config/postgresql.conf.j2` or `pg_hba.conf`). Are legacy MD5 users still present in any tier? Does the change affect pgbouncer's auth pass-through?

**Historical example**: CVE-2026-6478 (May 2026) — timing-unsafe MD5 password comparison. Affects legacy MD5-auth users.

### 11. Privileged-extension changes (Supabase-shipped extensions)

**What it looks like**: any commit under `contrib/<name>/` for extensions Supabase preloads or default-installs, OR any of the Supabase-shipped extensions in `nix/ext/` getting upstream updates.

**Detection**:
```bash
# Look at every contrib extension we ship
for ext in pgcrypto pg_stat_statements pgaudit pg_cron pg_net pgsodium pg_graphql pg_tle plan_filter supabase_vault auto_explain plpgsql plpgsql_check timescaledb intarray ltree hstore citext refint xml2 amcheck pgvector pg_trgm postgres_fdw; do
  count=$(git log <range> --oneline -- contrib/$ext/ 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then echo "$ext: $count commits"; fi
done
```

**Supabase impact questions**: For each affected extension, is it (a) preloaded via `shared_preload_libraries`, (b) auto-created in `migrations/db/init-scripts/`, or (c) merely available via `CREATE EXTENSION`? The first two affect every project; the third only affects opt-in customers.

---

## Supabase Surface Map

Inventory of what to cross-check Pattern Matrix findings against. Update this map when surface area changes.

### Default-enabled extensions (every Supabase project gets these)

From `migrations/db/init-scripts/00000000000000-initial-schema.sql`: `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`.

### `shared_preload_libraries` (worker extensions preloaded into every postmaster)

From `ansible/files/postgresql_config/postgresql.conf.j2`:
`pg_stat_statements, pgaudit, plpgsql, plpgsql_check, pg_cron, pg_net, pgsodium, timescaledb, auto_explain, pg_tle, plan_filter, supabase_vault`.

### Available extensions (in `nix/ext/`, opt-in via `CREATE EXTENSION`)

Run `ls nix/ext/` for the current list. Includes (non-exhaustive): pgvector, pgroonga, pgrouting, postgis, pgtap, pgjwt, hypopg, index_advisor, pg_hashids, pg_jsonschema, pg_partman, pg_repack, pg_safeupdate, pg_stat_monitor, pgmq, pljava, plv8, pg_backtrace.

### Customer-facing roles (non-superuser)

`postgres`, `anon`, `authenticated`, `service_role`, `supabase_admin_lite`. Note: in older clusters, `postgres` had elevated privileges; verify role definitions in `migrations/db/init-scripts/`.

### Privileged roles

`supabase_admin` (superuser), `supabase_storage_admin`, `supabase_auth_admin`, `supabase_replication_admin`, `supabase_functions_admin`.

### Backup / recovery tooling

- **wal-g**: PITR pipeline, uses `pg_basebackup`. Setup in `ansible/tasks/setup-wal-g.yml`.
- **pg_dumpall**: logical backups path. Used by dashboard backup flow.
- **pg_upgrade**: dashboard version-upgrade flow.

### API / connection-layer services that link libpq

`psql` (bundled in AMI), `pgbouncer` (connection pooling), `PostgREST`, `GoTrue`, `Realtime` (logical replication consumer).

### Other moving parts

- **supautils**: extension that enforces privilege restrictions (in `nix/ext/`); runtime config in `supautils.conf`, often overridden by `salt`.
- **orioledb-17**: alternative storage engine (PG 17 fork); check whether the issue applies to vanilla 17 only or orioledb too.
- **Dashboard flows**: project clone (uses pg_dump/pg_restore), version upgrade (uses pg_upgrade), in-dashboard "REINDEX" hints (where supported).
- **Supabase CLI**: bundles `docker/Dockerfile-15` and `Dockerfile-17` for local dev; libpq version bundled too.

---

## Boundaries

- **Always**: walk the full Pattern Matrix; verify CVE-to-commit mappings with `git tag --contains`; cross-check severity against the security page; cross-check every finding against the Supabase Surface Map.
- **Ask first**: before requesting a data-eng fleet scan (the analysis itself is read-only on `/tmp/postgres-upstream`).
- **Never**: trust commit-message CVSS over the security page; declare "no impact" without explicitly checking each surface area; rely on `--grep=CVE` alone.

## Reference

- Upstream security listing: https://www.postgresql.org/support/security/
- Per-release notes: https://www.postgresql.org/docs/release/<version>/
- `FirstGenbkiObjectId` threshold: `src/include/access/transam.h` (= 10000, used by upstream privilege gates)
- Breaking-changes process playbook: [`playbooks/product-ops/how-to-do-breaking-changes.md`](https://github.com/supabase/playbooks/blob/main/playbooks/product-ops/how-to-do-breaking-changes.md)
- PG-version-update infra playbook: [`playbooks/infra/running-minor-major-postgres-version-updates-for-platform-images.md`](https://github.com/supabase/playbooks/blob/main/playbooks/infra/running-minor-major-postgres-version-updates-for-platform-images.md)
- Worked example: [PSQL-1110](https://linear.app/supabase/issue/PSQL-1110) (May 2026 cycle)
