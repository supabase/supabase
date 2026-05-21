import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { countries } from '../_shared/schema.ts'

const connectionString = Deno.env.get('SUPABASE_DB_URL')!
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

Deno.serve(async (_req) => {
  const allCountries = await db.select().from(countries)

  return Response.json(allCountries)
})
