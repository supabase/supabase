import postgres from "npm:postgres@3.4.7";

const _global = globalThis as typeof globalThis & {
  _advisorsSql?: ReturnType<typeof postgres>;
};

function createPool() {
  const databaseUrl = Deno.env.get("DATABASE_URL") ?? Deno.env.get("SUPABASE_DB_URL");
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  });
}

if (!_global._advisorsSql) {
  _global._advisorsSql = createPool();
}

export const sql = _global._advisorsSql;
