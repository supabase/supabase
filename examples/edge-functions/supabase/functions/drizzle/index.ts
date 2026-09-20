import { drizzle } from 'npm:drizzle-orm@^0/postgres-js'
import postgres from 'npm:postgres@^3'

import { countries } from '../_shared/schema.ts'

const connectionString = Deno.env.get('SUPABASE_DB_URL')!
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

export default {
  fetch: async (_req) => {
    const allCountries = await db.select().from(countries)

    return Response.json(allCountries)
  },
}
