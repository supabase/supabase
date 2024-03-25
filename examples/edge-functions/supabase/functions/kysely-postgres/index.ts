// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { Pool } from 'postgres'
import {
  Generated,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely'
import { PostgresDriver } from './DenoPostgresDriver.ts'

console.log(`Function "kysely-postgres" up and running!`)

interface AnimalTable {
  id: Generated<bigint>
  animal: string
  created_at: Date
}

// Keys of this interface are table names.
interface Database {
  animals: AnimalTable
}

// Create a database pool with one connection.
const pool = new Pool(
  {
    tls: { caCertificates: [Deno.env.get('DB_SSL_CERT')!] },
    database: 'postgres',
    hostname: Deno.env.get('DB_HOSTNAME'),
    user: Deno.env.get('DB_USER'),
    port: 6543,
    password: Deno.env.get('DB_PASSWORD'),
  },
  1
)

// You'd create one of these when you start your app.
const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter()
    },
    createDriver() {
      // You need a driver to be able to execute queries. In this example
      // we use the dummy driver that never does anything.
      return new PostgresDriver({ pool })
    },
    createIntrospector(db: Kysely<unknown>) {
      return new PostgresIntrospector(db)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
})

Deno.serve(async (_req) => {
  try {
    // Run a query
    const animals = await db.selectFrom('animals').select(['id', 'animal', 'created_at']).execute()

    // Neat, it's properly typed \o/
    console.log(animals[0].created_at.getFullYear())

    // Encode the result as pretty printed JSON
    const body = JSON.stringify(
      animals,
      (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    )

    // Return the response with the correct content type header
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})

// To invoke: navigate to http://localhost:54321/functions/v1/kysely-postgres
