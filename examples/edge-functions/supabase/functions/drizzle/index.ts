import { drizzle } from 'npm:drizzle-orm@^0/postgres-js'
import postgres from 'npm:postgres@^3'

import { countries } from '../_shared/schema.ts'

// For production Edge Functions, connect via the transaction pooler URL (e.g. set as a secret).
// Falls back to SUPABASE_DB_URL for direct non-pooling connections.
const connectionString =
  Deno.env.get('DATABASE_POOLER_URL') ?? Deno.env.get('SUPABASE_DB_URL')!

// Disable prefetch/prepared statements as they are not supported in transaction pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

export default {
  fetch: async (_req) => {
    const allCountries = await db.select().from(countries)

    return Response.json(allCountries)
  },
}