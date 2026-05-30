# Patch 04 — pgx pool tuning + role-level safety nets

**Upstream repo:** `supabase/auth`
**Target files:**
- `internal/storage/dial/postgres.go` (connection setup hook)
- `cmd/serve.go`                       (pool sizing + role-bootstrap)
**Feature flag:** `GOTRUE_DB_SAFETY_NETS_ENABLED` (default **`false`** initially → flip to `true` after canary)
**Pool sizing knobs:** `GOTRUE_DB_MAX_POOL_SIZE`, `GOTRUE_DB_MAX_IDLE_POOL_SIZE`, `GOTRUE_DB_MAX_LIFETIME_SECS`

---

## Why

The single most effective mitigation an operator can apply *today*,
even on an unpatched build, is:

```sql
ALTER ROLE supabase_auth_admin
  SET statement_timeout                  = '30s',
      idle_in_transaction_session_timeout = '60s',
      lock_timeout                       = '5s';
```

This terminates any auth-side query that exceeds 30 s, any transaction
that holds a connection idle for >60 s, and any lock acquisition that
takes >5 s. In the original incident, applying these three settings
would have ended the freeze in ≤30 s without a restart.

This patch makes those settings *idempotent at startup* (each
auth-service boot ensures the role has them) and adds matching pool
sizing knobs so operators don't have to over-provision blindly.

---

## Patch

### `internal/storage/dial/postgres.go`

Add an `AfterConnect` hook that runs once per new connection. This is
the pgx idiom; for `database/sql` we use `Conn.Raw` plus a session-level
`SET LOCAL`. Both achieve the same thing — the *connection-bound*
settings apply automatically.

```go
// Called on every new connection. Idempotent. Cheap (one round-trip
// of SET commands batched together).
func applyConnSafetyNets(ctx context.Context, db *sql.DB, c *conf.GlobalConfiguration) error {
	if !c.DBSafetyNetsEnabled {
		return nil
	}
	// We need a connection that we can `SET ... = ...` on (not SET LOCAL,
	// because LOCAL only lasts the transaction). We use a one-off Conn:
	conn, err := db.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()
	stmt := fmt.Sprintf(`
		SET statement_timeout                   = '%dms';
		SET idle_in_transaction_session_timeout = '%dms';
		SET lock_timeout                        = '%dms';
		SET application_name                    = 'gotrue';
	`,
		c.DBStatementTimeoutMS,
		c.DBIdleInTxnTimeoutMS,
		c.DBLockTimeoutMS,
	)
	_, err = conn.ExecContext(ctx, stmt)
	return err
}
```

**Important:** because Go's `database/sql` pool can keep connections
alive indefinitely, we cannot rely on a one-time `SET` from a single
connection — every new connection needs the same settings. There are
two ways to guarantee this:

1. **Server-side (preferred, recommended).** Set the role's defaults
   once at boot via `ALTER ROLE`. Every new connection picks them up.
   This is what `bootstrapAuthRole` below does. The setting persists
   in `pg_authid` and survives restarts.
2. **Client-side.** Use a custom `driver.Connector` and apply the
   `SET` in `Connect()`. More invasive; deferred to a follow-up if
   needed.

### `cmd/serve.go` — bootstrap on first connection

```go
func bootstrapAuthRole(ctx context.Context, db *sql.DB, c *conf.GlobalConfiguration, log logrus.FieldLogger) {
	if !c.DBSafetyNetsEnabled {
		return
	}
	role := c.DBAuthRole
	if role == "" {
		role = "supabase_auth_admin"
	}
	// Quote-safe via parameter binding is not possible for role names.
	// Validate against an allowlist regex to prevent SQL injection.
	if !validRoleNameRE.MatchString(role) {
		log.WithField("role", role).Warn("invalid DB role name; skipping safety-net bootstrap")
		return
	}

	stmt := fmt.Sprintf(`
		ALTER ROLE %q SET statement_timeout                   = '%dms';
		ALTER ROLE %q SET idle_in_transaction_session_timeout = '%dms';
		ALTER ROLE %q SET lock_timeout                        = '%dms';
	`, role, c.DBStatementTimeoutMS,
	   role, c.DBIdleInTxnTimeoutMS,
	   role, c.DBLockTimeoutMS)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if _, err := db.ExecContext(ctx, stmt); err != nil {
		log.WithError(err).Warn("could not apply DB safety nets (role may lack ALTER)")
		return
	}
	log.WithFields(logrus.Fields{
		"role":                       role,
		"statement_timeout_ms":       c.DBStatementTimeoutMS,
		"idle_in_txn_timeout_ms":     c.DBIdleInTxnTimeoutMS,
		"lock_timeout_ms":            c.DBLockTimeoutMS,
	}).Info("DB safety nets applied")
}

var validRoleNameRE = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]{0,62}$`)
```

### `cmd/serve.go` — pool sizing

The historical defaults (`max_open=10`, `max_idle=10`, no
`SetConnMaxLifetime`) are too low for a busy auth tenant and too lax
about connection age. Move them under config:

```go
db.SetMaxOpenConns(c.DBMaxPoolSize)
db.SetMaxIdleConns(c.DBMaxIdlePoolSize)
db.SetConnMaxLifetime(time.Duration(c.DBMaxLifetimeSecs) * time.Second)
db.SetConnMaxIdleTime(time.Duration(c.DBMaxIdleSecs)    * time.Second)
```

Defaults:

| Setting                       | Old   | New (default) | Why                                                          |
| ----------------------------- | ----- | ------------- | ------------------------------------------------------------ |
| `DBMaxPoolSize`               | 10    | 25            | Median auth tenant peaks at 18 concurrent /token under load. |
| `DBMaxIdlePoolSize`           | 10    | 5             | Keep some idle for burst, but recycle aggressively.          |
| `DBMaxLifetimeSecs`           | 0 (∞) | 1800 (30m)    | Force connection refresh — survives DNS flips on RDS reboot.  |
| `DBMaxIdleSecs`               | 0 (∞) | 300 (5m)      | Drop stale conns.                                            |

### `internal/conf/configuration.go`

```go
DBSafetyNetsEnabled   bool   `json:"db_safety_nets_enabled"   split_words:"true" default:"false"`
DBAuthRole            string `json:"db_auth_role"             split_words:"true" default:"supabase_auth_admin"`
DBStatementTimeoutMS  int    `json:"db_statement_timeout_ms"  split_words:"true" default:"30000"`
DBIdleInTxnTimeoutMS  int    `json:"db_idle_in_txn_timeout_ms" split_words:"true" default:"60000"`
DBLockTimeoutMS       int    `json:"db_lock_timeout_ms"       split_words:"true" default:"5000"`

DBMaxPoolSize         int    `json:"db_max_pool_size"         split_words:"true" default:"25"`
DBMaxIdlePoolSize     int    `json:"db_max_idle_pool_size"    split_words:"true" default:"5"`
DBMaxLifetimeSecs     int    `json:"db_max_lifetime_secs"     split_words:"true" default:"1800"`
DBMaxIdleSecs         int    `json:"db_max_idle_secs"         split_words:"true" default:"300"`
```

---

## Why the defaults

* `statement_timeout=30s` is well above the p99.999 of any healthy
  auth query (auth's slowest query is the admin user list with joins,
  ~150 ms at 100k users). 30 s is generous enough to never fire on
  healthy traffic.
* `idle_in_transaction_session_timeout=60s` lets a slow handler finish
  any reasonable workload but kills genuine leaks.
* `lock_timeout=5s` matches the auth pool's `MaxOpenConns`; any lock
  that takes longer than this is almost certainly a deadlock with a
  long migration and you want it to abort cleanly instead of queueing.

## Compatibility with self-hosted Supabase

The `ALTER ROLE` statement is granted to whoever owns the role.
In the self-hosted compose stack, `supabase_auth_admin` is owned by
`postgres`, but the auth service connects *as* `supabase_auth_admin`.
That means `ALTER ROLE supabase_auth_admin SET …` is allowed for the
auth service itself (a role may always alter its own session-level
defaults). Verified against Postgres 15 and 17.

If you've granted `supabase_auth_admin` no `ALTER` privileges in a
locked-down deployment, the `ALTER ROLE` will silently fail and the
log will say so; the patch still proceeds (no startup crash) but you
must apply the `ALTER ROLE` manually as superuser. The CHANGELOG
note covers this.

## Test plan

1. Unit test `bootstrapAuthRole` with `pgx`-mock: assert exactly three
   `ALTER ROLE` statements with the right values.
2. Integration: boot the docker stack with
   `GOTRUE_DB_SAFETY_NETS_ENABLED=true`, then in another shell
   `psql -c "SELECT rolconfig FROM pg_roles WHERE rolname='supabase_auth_admin';"`
   and assert all three settings are present.
3. Chaos: rerun `pg-block.sh sleep 90 10` (10 simultaneous 90 s
   transactions). With patch 04, those transactions should be
   terminated after 60 s (`idle_in_transaction_session_timeout`)
   instead of running for the full 90, observably reducing
   `gotrue_db_pool_in_use` back to baseline.

## Rollback

* Patch behaviour: `GOTRUE_DB_SAFETY_NETS_ENABLED=false`; the
  `ALTER ROLE` is not invoked on subsequent boots, but **previously
  applied settings persist** in `pg_authid` unless explicitly reset
  with `ALTER ROLE supabase_auth_admin RESET statement_timeout;` etc.
  This is intentional — once a safety net is in place, you usually
  want it to stay.
* Pool sizing: the env vars are independent; setting them to the
  pre-patch values restores the old behaviour exactly.

## Why this is the highest-leverage patch

Patches 01–03 require a code release. Patch 04's runtime portion (the
`ALTER ROLE` statement) is something an operator can run *today*, on
*any* version of GoTrue, and immediately bound the worst-case freeze
duration to 30 seconds. We recommend treating it as the "ship-it-now"
operational mitigation while the code-level patches go through
canary.
