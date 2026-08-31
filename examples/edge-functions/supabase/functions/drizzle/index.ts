import { drizzle } from 'npm:drizzle-orm@^0/postgres-js'
import postgres from 'npm:postgres@^3'

import { countries } from '../_shared/schema.ts'

// Get a direct connection string. In production Edge Functions, it's recommended
// to connect via the transaction pooler URL by adding it as a secret.
const connectionString = Deno.env.get('SUPABASE_DB_URL')!

// Prepared statements are disabled so this works with the transaction pooler,
// which doesn't support them.
const client = postgres(connectionString, { prepare: false })

const db = drizzle(client)

export default {
  fetch: async (_req) => {
    const allCountries = await db.select().from(countries)

    return Response.json(allCountries)
  },
}
