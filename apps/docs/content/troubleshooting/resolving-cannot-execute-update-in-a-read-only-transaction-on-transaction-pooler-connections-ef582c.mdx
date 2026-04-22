---
title = "Resolving 'cannot execute UPDATE in a read-only transaction' on transaction pooler connections"
topics = [ "database", "supavisor" ]
keywords = []
---

### Key technical terms

**Transaction Pooling**
A connection management method used by tools like Supavisor or PgBouncer. Instead of giving every client a dedicated, permanent connection to the database, the pooler maintains a small set of "backend connections." It lends one of these connections to a client for the duration of a single transaction, then immediately takes it back to give to another client.

**Backend Connection**
The actual physical process on the Postgres server that executes your queries. In pooling environments, one backend connection will serve many different database clients over its lifetime.

**Session-Level State**
That backend connection has _state_. Postgres connections carry settings like timezone, memory limits, search path, read-only mode etc. In a normal setup where each client has its own connection, this doesn't matter. When the client disconnects, the connection and all its state go away. In a pooled environment, the connection doesn't go away. It goes back into the pool, settings and all, and the next client who gets it inherits whatever was left behind.

---

### Understanding the problem: The "sticky" state

When you encounter the error `cannot execute UPDATE in a read-only transaction` while using a transaction pooler (typically on port 6543), even when you have verified that the connection is made to the primary database and the database itself is not in read-only mode (check with `SHOW default_transaction_read_only;` or `SELECT pg_is_in_recovery();` using a direct connection on port 5432), it signifies that a backend connection has been unintentionally locked into a read-only state.

**Note:** If your database is in read-only mode (for example, due to exceeding disk space limits), you can review this guide: [Database Size and Read-Only Mode](/docs/guides/platform/database-size#read-only-mode). The remainder of this guide addresses a different issue specific to transaction pooling.

#### The cause: Connection contamination

In transaction pooling mode, reset behavior is intentionally limited for performance, so session state can persist unless explicitly reset. If a client, script, or automated task changes a session-level setting, that setting "sticks" to the backend connection.

When that backend connection is returned to the pool, the next client to use it inherits that exact state. If a previous script set the connection to "read-only" for safety and failed to reset it, any subsequent application attempt to perform an `UPDATE` or `INSERT` using that same backend will fail.

#### Why is the error sporadic?

The error appears intermittent because it only occurs when your application is randomly assigned a "contaminated" backend connection from the pool. Other connections in the same pool may still be in the default read-write state, leading to a confusing mix of successful and failed requests.

---

### Step-by-step resolution

To resolve this issue, you must identify and remove any commands that modify the session state globally rather than locally.

#### 1. Audit application and scripts

Search your application code, migration scripts, and maintenance tasks for the following session-level commands:

- `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;`
- `SET default_transaction_read_only = on;`

Even if these commands are used in secondary scripts (like data exports or safety-first maintenance tasks) and not the main application, they can still contaminate the pool used by the main application.

#### 2. Implement "safe" settings

If you need to execute a read-only transaction for safety, use transaction-level commands that only affect the current transaction and do not persist on the backend connection.

- **Avoid:** `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;` or `SET default_transaction_read_only = on;` (these contaminate the connection pool)
- **Use:** `BEGIN TRANSACTION READ ONLY;` or `BEGIN; SET TRANSACTION READ ONLY;` (these only affect the current transaction)

If you have existing scripts that use session-level settings and cannot be immediately refactored:

- **Temporary workaround:** Ensure they explicitly reset the state before closing the connection with `SET default_transaction_read_only = off;`
- **Best approach:** Connect directly to port 5432 (bypassing the pooler) for scripts requiring special session states

#### 3. Connection string verification

Ensure your application is using the intended pooler.

- **Shared Transaction Pooler (Supavisor):** `postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-X-REGION.pooler.supabase.com:6543/postgres`
- **Dedicated Transaction Pooler (PgBouncer):** `postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:6543/postgres`

---

### Best practices for transaction pooling

- **Use Dedicated Connections for Maintenance:** If a script requires a specific session state (like a long-running read-only export), connect directly to the database (port 5432) rather than using the transaction pooler (port 6543). This prevents maintenance settings from leaking into the application's connection pool.%
