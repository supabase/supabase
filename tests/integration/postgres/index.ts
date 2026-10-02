/**
 * postgres-integration-test
 *
 * Edge function test runner for postgres integration.
 * Runs inside the edge-runtime (no Deno.test available).
 *
 * GET / → runs all test steps and returns a JSON report.
 *         HTTP 200 = all passed, HTTP 500 = one or more failed.
 *
 * The DATABASE_URL env var is forwarded from the main worker automatically.
 */

import postgres, { type Sql } from "npm:postgres@3";

// ---------------------------------------------------------------------------
// Mini test framework
// ---------------------------------------------------------------------------

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

async function step(
  results: TestResult[],
  name: string,
  fn: (sql: Sql) => Promise<void>,
  sql: Sql,
): Promise<boolean> {
  const t0 = performance.now();
  try {
    await fn(sql);
    results.push({
      name,
      passed: true,
      durationMs: Math.round(performance.now() - t0),
    });
    return true;
  } catch (e: unknown) {
    results.push({
      name,
      passed: false,
      durationMs: Math.round(performance.now() - t0),
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function dropDemoTables(sql: Sql) {
  await sql`DROP TABLE IF EXISTS pg_demo_posts CASCADE`;
  await sql`DROP TABLE IF EXISTS pg_demo_users CASCADE`;
}

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  const same = JSON.stringify(
    actual,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
  ) ===
    JSON.stringify(
      expected,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    );
  if (!same) {
    throw new Error(
      `${message ?? "assertEquals"}: expected ${
        JSON.stringify(expected)
      } but got ${JSON.stringify(actual)}`,
    );
  }
}

function assertExists(v: unknown, message?: string) {
  if (v === null || v === undefined) {
    throw new Error(`${message ?? "assertExists"}: value is ${v}`);
  }
}

function assertGreater(
  a: number | bigint,
  b: number | bigint,
  message?: string,
) {
  if (!(a > b)) {
    throw new Error(`${message ?? "assertGreater"}: ${a} is not > ${b}`);
  }
}

function assertMatch(s: string, re: RegExp, message?: string) {
  if (!re.test(s)) {
    throw new Error(`${message ?? "assertMatch"}: "${s}" does not match ${re}`);
  }
}

// ---------------------------------------------------------------------------
// Test steps
// ---------------------------------------------------------------------------

async function runAllTests(sql: Sql): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const s = (name: string, fn: (sql: Sql) => Promise<void>) =>
    step(results, name, fn, sql);

  let aliceId: bigint = 0n;
  let bobId: bigint = 0n;

  // --- 0. clean slate ---
  await s("pre-test: drop leftover tables", dropDemoTables);

  // --- 1. connectivity ---
  await s("connection: server info", async (sql) => {
    const [row] = await sql`SELECT version() AS ver, current_database() AS db`;
    assertExists(row.ver);
    assertExists(row.db);
    console.log(`  [db] ${String(row.ver).split(" ").slice(0, 3).join(" ")}`);
  });

  // --- 2. DDL ---
  const ddlOk = await s("ddl: create tables and GIN index", async (sql) => {
    await sql`
      CREATE TABLE pg_demo_users (
        id         BIGSERIAL PRIMARY KEY,
        name       TEXT          NOT NULL,
        email      TEXT          NOT NULL UNIQUE,
        balance    NUMERIC(12,2) NOT NULL DEFAULT 0,
        metadata   JSONB,
        created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE pg_demo_posts (
        id         BIGSERIAL PRIMARY KEY,
        user_id    BIGINT REFERENCES pg_demo_users(id) ON DELETE CASCADE,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL,
        tsv        TSVECTOR GENERATED ALWAYS AS (
                     to_tsvector('english', title || ' ' || body)
                   ) STORED,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX pg_demo_posts_tsv_idx ON pg_demo_posts USING GIN (tsv)`;

    const [row] = await sql`
      SELECT COUNT(*)::INT AS cnt FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'pg_demo_%'
    `;
    assertEquals(row.cnt, 2, "expected 2 demo tables");
  });

  if (!ddlOk) {
    // remaining tests depend on the schema – skip them cleanly
    results.push({
      name: "(skipped remaining: DDL failed)",
      passed: false,
      durationMs: 0,
      error: "DDL setup failed",
    });
    return results;
  }

  // --- 3. parameterised literals (injection safety) ---
  await s(
    "query: SQL-injection via parameter binding is escaped",
    async (sql) => {
      const malicious = "'; DROP TABLE pg_demo_users; --";
      const [row] = await sql`SELECT ${malicious}::TEXT AS val`;
      assertEquals(row.val, malicious);

      const [{ cnt }] = await sql`
      SELECT COUNT(*)::INT AS cnt FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'pg_demo_users'
    `;
      assertEquals(cnt, 1, "table must still exist");
    },
  );

  // --- 4. INSERT / RETURNING ---
  await s("crud: insert two users with RETURNING", async (sql) => {
    const [alice] = await sql`
      INSERT INTO pg_demo_users (name, email, balance, metadata)
      VALUES (
        'Alice', 'alice@example.com', 1000,
        ${
      sql.json({
        role: "admin",
        tags: ["power-user", "beta"],
        address: { city: "Seoul", country: "KR" },
      })
    }
      )
      RETURNING *
    `;
    assertExists(alice.id);
    assertEquals(alice.name, "Alice");
    assertEquals(Number(alice.balance), 1000);
    aliceId = alice.id;

    const [bob] = await sql`
      INSERT INTO pg_demo_users (name, email, balance)
      VALUES ('Bob', 'bob@example.com', 500)
      RETURNING *
    `;
    assertExists(bob.id);
    bobId = bob.id;
  });

  // --- 5. SELECT with dynamic ORDER BY ---
  await s("crud: list with pagination and allowlist ORDER BY", async (sql) => {
    const limit = 10;
    const col = "balance"; // validated before reaching sql()
    const users = await sql`
      SELECT name, balance FROM pg_demo_users
      ORDER BY ${sql(col)} DESC
      LIMIT ${limit} OFFSET 0
    `;
    assertEquals(users.length, 2);
    assertEquals(users[0].name, "Alice", "DESC by balance: Alice first");
  });

  // --- 6. SELECT single row ---
  await s("crud: get user by id", async (sql) => {
    const [u] =
      await sql`SELECT name, email FROM pg_demo_users WHERE id = ${aliceId}`;
    assertEquals(u.name, "Alice");
    assertEquals(u.email, "alice@example.com");
  });

  // --- 7. UPDATE with dynamic patch ---
  await s("crud: partial UPDATE using sql(patch)", async (sql) => {
    const patch = { name: "Alice Updated", balance: 900 };
    const [u] = await sql`
      UPDATE pg_demo_users SET ${sql(patch)}
      WHERE id = ${aliceId}
      RETURNING name, balance
    `;
    assertEquals(u.name, "Alice Updated");
    assertEquals(Number(u.balance), 900);
    // restore
    await sql`UPDATE pg_demo_users SET name='Alice', balance=1000 WHERE id=${aliceId}`;
  });

  // --- 8. DELETE ---
  await s("crud: delete a row", async (sql) => {
    const [tmp] = await sql`
      INSERT INTO pg_demo_users (name, email) VALUES ('Tmp','tmp@example.com') RETURNING id
    `;
    await sql`DELETE FROM pg_demo_users WHERE id = ${tmp.id}`;
    const rows = await sql`SELECT id FROM pg_demo_users WHERE id = ${tmp.id}`;
    assertEquals(rows.length, 0);
  });

  // --- 9. Transaction: commit ---
  await s("transaction: commit path (sql.begin + FOR UPDATE)", async (sql) => {
    const { from, to } = await sql.begin(async (tx) => {
      const [s] =
        await tx`SELECT balance FROM pg_demo_users WHERE id=${aliceId} FOR UPDATE`;
      const [r] =
        await tx`SELECT balance FROM pg_demo_users WHERE id=${bobId}   FOR UPDATE`;
      await tx`UPDATE pg_demo_users SET balance=balance-100 WHERE id=${aliceId}`;
      await tx`UPDATE pg_demo_users SET balance=balance+100 WHERE id=${bobId}`;
      return { from: Number(s.balance) - 100, to: Number(r.balance) + 100 };
    });
    const [a] =
      await sql`SELECT balance FROM pg_demo_users WHERE id=${aliceId}`;
    const [b] = await sql`SELECT balance FROM pg_demo_users WHERE id=${bobId}`;
    assertEquals(Number(a.balance), from);
    assertEquals(Number(b.balance), to);
  });

  // --- 10. Transaction: rollback ---
  await s("transaction: rollback on business-logic throw", async (sql) => {
    const [before] =
      await sql`SELECT balance FROM pg_demo_users WHERE id=${aliceId}`;
    let threw = false;
    try {
      await sql.begin(async (tx) => {
        await tx`UPDATE pg_demo_users SET balance=balance-999999 WHERE id=${aliceId}`;
        const [row] =
          await tx`SELECT balance FROM pg_demo_users WHERE id=${aliceId}`;
        if (Number(row.balance) < 0) throw new Error("insufficient balance");
      });
    } catch {
      threw = true;
    }
    assert(threw, "should have thrown");
    const [after] =
      await sql`SELECT balance FROM pg_demo_users WHERE id=${aliceId}`;
    assertEquals(
      Number(after.balance),
      Number(before.balance),
      "balance must be unchanged",
    );
  });

  // --- 11. JSONB ---
  await s("jsonb: @> containment query", async (sql) => {
    const admins = await sql`
      SELECT name FROM pg_demo_users WHERE metadata @> ${{
      role: "admin",
    }}::jsonb
    `;
    assertEquals(admins.length, 1);
    assertEquals(admins[0].name, "Alice");
  });

  await s("jsonb: ->> path extraction", async (sql) => {
    const [row] = await sql`
      SELECT
        metadata->>'role'                AS role,
        metadata->'address'->>'city'     AS city,
        metadata->'address'->>'country'  AS country
      FROM pg_demo_users WHERE id = ${aliceId}
    `;
    assertEquals(row.role, "admin");
    assertEquals(row.city, "Seoul");
    assertEquals(row.country, "KR");
  });

  await s("jsonb: jsonb_array_elements_text unnests tag array", async (sql) => {
    const tags = await sql`
      SELECT tag, COUNT(*)::INT AS cnt
      FROM pg_demo_users, jsonb_array_elements_text(metadata->'tags') AS tag
      WHERE metadata IS NOT NULL
      GROUP BY tag ORDER BY cnt DESC, tag
    `;
    assertGreater(tags.length, 0);
    for (const r of tags) assertGreater(r.cnt, 0);
  });

  // --- 12. Batch INSERT ---
  await s("batch: bulk insert 10 rows in one round-trip", async (sql) => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      userId: aliceId,
      title: `Batch Post ${i + 1}`,
      body: `Content for batch post ${i + 1}. Testing full-text search.`,
    }));
    const inserted = await sql`
      INSERT INTO pg_demo_posts ${
      sql(rows, "userId", "title", "body")
    } RETURNING id
    `;
    assertEquals(inserted.length, 10);
  });

  // --- 13. Full-text search ---
  await s("fts: GIN index, ts_rank, ts_headline", async (sql) => {
    const q = "batch";
    const rows = await sql`
      SELECT p.title,
             ts_rank(p.tsv, query)                                          AS rank,
             ts_headline('english', p.body, query, 'MaxFragments=1,MaxWords=8,MinWords=3') AS hl
      FROM pg_demo_posts p, to_tsquery('english', ${q}) AS query
      WHERE p.tsv @@ query
      ORDER BY rank DESC LIMIT 5
    `;
    assertGreater(rows.length, 0);
    for (const r of rows) assertMatch(r.hl.toLowerCase(), /batch/);
  });

  // --- 14. Aggregation & window functions ---
  await s("aggregate: GROUP BY stats", async (sql) => {
    const [s2] = await sql`
      SELECT COUNT(*)::INT AS total, MAX(balance) AS mx, MIN(balance) AS mn
      FROM pg_demo_users
    `;
    assertEquals(s2.total, 2);
    assert(Number(s2.mx) >= Number(s2.mn), "max >= min");
  });

  await s("aggregate: RANK() OVER window function", async (sql) => {
    const rows = await sql`
      SELECT name, RANK() OVER (ORDER BY balance DESC) AS rnk FROM pg_demo_users ORDER BY rnk
    `;
    assertEquals(rows.length, 2);
    assertEquals(rows[0].rnk, 1n);
  });

  await s("aggregate: CTE (WITH clause)", async (sql) => {
    const rows = await sql`
      WITH pc AS (SELECT user_id, COUNT(*)::INT AS cnt FROM pg_demo_posts GROUP BY user_id)
      SELECT u.name, COALESCE(pc.cnt, 0) AS post_count
      FROM pg_demo_users u LEFT JOIN pc ON pc.user_id = u.id
      ORDER BY post_count DESC
    `;
    assertGreater(rows.length, 0);
    assertEquals(rows[0].name, "Alice");
    assertGreater(rows[0].postCount, 0);
  });

  // --- 15. Type handling ---
  await s("types: BIGSERIAL / COUNT returns BigInt", async (sql) => {
    const [{ cnt }] =
      await sql`SELECT COUNT(*)::BIGINT AS cnt FROM pg_demo_users`;
    assertEquals(typeof cnt, "bigint");
    assertEquals(cnt, 2n);
  });

  // --- 16. Error codes ---
  await s("error: 23505 unique_violation", async (sql) => {
    let code: string | undefined;
    try {
      await sql`INSERT INTO pg_demo_users (name, email) VALUES ('Dup','alice@example.com')`;
    } catch (e: unknown) {
      code = (e as { code?: string }).code;
    }
    assertEquals(code, "23505");
  });

  await s("error: 23503 foreign_key_violation", async (sql) => {
    let code: string | undefined;
    try {
      await sql`INSERT INTO pg_demo_posts (user_id,title,body) VALUES (999999999,'x','x')`;
    } catch (e: unknown) {
      code = (e as { code?: string }).code;
    }
    assertEquals(code, "23503");
  });

  await s("error: 42P01 undefined_table", async (sql) => {
    let code: string | undefined;
    try {
      await sql`SELECT * FROM does_not_exist_xyz`;
    } catch (e: unknown) {
      code = (e as { code?: string }).code;
    }
    assertEquals(code, "42P01");
  });

  await s(
    "error: 22P02 invalid_text_representation (bad cast)",
    async (sql) => {
      let code: string | undefined;
      try {
        await sql`SELECT ${"not-a-number"}::INTEGER`;
      } catch (e: unknown) {
        code = (e as { code?: string }).code;
      }
      assertEquals(code, "22P02");
    },
  );

  // --- 17. Upsert ---
  await s("upsert: ON CONFLICT DO UPDATE", async (sql) => {
    await sql`INSERT INTO pg_demo_users (name,email,balance) VALUES ('Up','up@example.com',10)`;
    const [r] = await sql`
      INSERT INTO pg_demo_users (name,email,balance) VALUES ('Up','up@example.com',99)
      ON CONFLICT (email) DO UPDATE SET balance=EXCLUDED.balance
      RETURNING balance
    `;
    assertEquals(Number(r.balance), 99);
    await sql`DELETE FROM pg_demo_users WHERE email='up@example.com'`;
  });

  // --- 18. CASCADE DELETE ---
  await s("cascade: delete user removes posts via FK cascade", async (sql) => {
    const [u] = await sql`
      INSERT INTO pg_demo_users (name,email) VALUES ('Del','del@example.com') RETURNING id
    `;
    await sql`INSERT INTO pg_demo_posts (user_id,title,body) VALUES (${u.id},'T','B')`;
    await sql`DELETE FROM pg_demo_users WHERE id=${u.id}`;
    const [{ cnt }] = await sql`
      SELECT COUNT(*)::INT AS cnt FROM pg_demo_posts WHERE user_id=${u.id}
    `;
    assertEquals(cnt, 0);
  });

  // --- teardown ---
  await s("teardown: drop demo tables", dropDemoTables);

  return results;
}

// ---------------------------------------------------------------------------
// Edge function entry point
// ---------------------------------------------------------------------------

const DATABASE_URL = Deno.env.get("DATABASE_URL");

Deno.serve(async (req: Request) => {
  // Health probe used by the orchestrator during startup polling
  if (new URL(req.url).pathname === "/_internal/health") {
    return Response.json({ ok: true });
  }

  if (!DATABASE_URL) {
    return Response.json(
      { ok: false, error: "DATABASE_URL env var is not set" },
      { status: 500 },
    );
  }

  const sql: Sql = postgres(DATABASE_URL, {
    max: 3,
    idle_timeout: 30,
    connect_timeout: 15,
    transform: postgres.camel,
    types: { bigint: postgres.BigInt },
  });

  const suiteStart = performance.now();
  let results: TestResult[] = [];

  try {
    results = await runAllTests(sql);
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalMs = Math.round(performance.now() - suiteStart);

  const body = { ok: failed === 0, passed, failed, totalMs, results };
  return Response.json(body, { status: failed > 0 ? 500 : 200 });
});
