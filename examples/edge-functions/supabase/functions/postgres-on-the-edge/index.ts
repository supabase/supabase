import { Pool } from 'jsr:@db/postgres@^0'

// Create a database pool with one connection.
const pool = new Pool(Deno.env.get('SUPABASE_DB_URL')!, 1)

export default {
  fetch: async (_req) => {
    try {
      // Grab a connection from the pool
      const connection = await pool.connect()

      try {
        // Run a query
        const result = await connection.queryObject`SELECT * FROM animals`
        const animals = result.rows // [{ id: 1, name: "Lion" }, ...]

        const data = animals.map((animal) =>
          Object.fromEntries(
            Object.entries(animal).map(([key, value]) => [
              key,
              typeof value === 'bigint' ? value.toString() : value,
            ])
          )
        )

        return Response.json(data, {
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
      return Response.json({ error: String(err?.message ?? err) }, { status: 500 })
    }
  },
}
