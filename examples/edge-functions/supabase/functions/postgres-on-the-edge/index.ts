import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

// Create a database pool with one connection.
const pool = new Pool(
  {
    tls: { enabled: false },
    database: 'postgres',
    hostname: Deno.env.get('DB_HOSTNAME'),
    user: Deno.env.get('DB_USER'),
    port: 6543,
    password: Deno.env.get('DB_PASSWORD'),
  },
  1
)

Deno.serve(async (_req) => {
  try {
    // Grab a connection from the pool
    const connection = await pool.connect()

    try {
      // Run a query
      const result = await connection.queryObject`SELECT * FROM animals`
      const animals = result.rows // [{ id: 1, name: "Lion" }, ...]

      // Encode the result as pretty printed JSON
      const body = JSON.stringify(
        animals,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )

      // Return the response with the correct content type header
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    } finally {
      // Release the connection back into the pool
      connection.release()
    }
  } catch (err) {
    console.error(err)
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
