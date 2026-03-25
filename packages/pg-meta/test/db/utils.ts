import { randomUUID } from 'crypto'
import pg, { Pool } from 'pg'
import { parse as parseArray } from 'postgres-array'

// Those types override are in sync with `postgres-meta` since the queries
// will get executed via `execQuery` on a pg connection with the same configuration
// see: https://github.com/supabase/postgres-meta/blob/ca06061b4708971628134f95e49f254c2dfdfa7d/src/lib/db.ts#L6-L23
pg.types.setTypeParser(pg.types.builtins.INT8, (x) => {
  const asNumber = Number(x)
  if (Number.isSafeInteger(asNumber)) {
    return asNumber
  } else {
    return x
  }
})
pg.types.setTypeParser(pg.types.builtins.DATE, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INTERVAL, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (x) => x)
pg.types.setTypeParser(1115, parseArray) // _timestamp
pg.types.setTypeParser(1182, parseArray) // _date
pg.types.setTypeParser(1185, parseArray) // _timestamptz
pg.types.setTypeParser(600, (x) => x) // point
pg.types.setTypeParser(1017, (x) => x) // _point

const ROOT_DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432'
const ROOT_DB_NAME = process.env.DATABASE_NAME ?? 'postgres'

// Replace postgres.js root connection with pg connection
const rootPool = new Pool({
  connectionString: `${ROOT_DB_URL}/${ROOT_DB_NAME}`,
  max: 1,
})

export async function createTestDatabase() {
  const dbName = `test_${randomUUID().replace(/-/g, '_')}`

  try {
    await rootPool.query(`CREATE DATABASE ${dbName};`)

    const pool = new Pool({
      connectionString: `${ROOT_DB_URL}/${dbName}`,
      max: 1,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    })

    return {
      dbName,
      client: 'pg' as const,
      executeQuery: async <T = any>(query: string): Promise<T> => {
        try {
          const res = await pool.query(query)
          return res.rows as T
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to execute query: ${error.message}`)
          }
          throw error
        }
      },
      cleanup: async () => {
        await pool.end()
        await rootPool.query(`DROP DATABASE ${dbName};`)
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create test database: ${error.message}`)
    }
    throw error
  }
}

// Update cleanup function to use pg pool
export async function cleanupRoot() {
  await rootPool.end()
}

export async function createDatabaseWithAuthSchema(
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  options?: { includeIdentities?: boolean }
) {
  const { includeIdentities = false } = options || {}

  await db.executeQuery(`
    CREATE SCHEMA IF NOT EXISTS auth;

    CREATE TABLE IF NOT EXISTS auth.users (
      instance_id uuid NULL,
      id uuid NOT NULL UNIQUE,
      aud varchar(255) NULL,
      "role" varchar(255) NULL,
      email varchar(255) NULL,
      encrypted_password varchar(255) NULL,
      email_confirmed_at timestamptz NULL,
      invited_at timestamptz NULL,
      confirmation_token varchar(255) NULL,
      confirmation_sent_at timestamptz NULL,
      recovery_token varchar(255) NULL,
      recovery_sent_at timestamptz NULL,
      email_change_token varchar(255) NULL,
      email_change varchar(255) NULL,
      email_change_sent_at timestamptz NULL,
      last_sign_in_at timestamptz NULL,
      raw_app_meta_data jsonb NULL,
      raw_user_meta_data jsonb NULL,
      is_super_admin bool NULL,
      created_at timestamptz NULL,
      updated_at timestamptz NULL,
      phone text NULL,
      phone_confirmed_at timestamptz NULL,
      phone_change text NULL,
      phone_change_token varchar(255) NULL,
      phone_change_sent_at timestamptz NULL,
      confirmed_at timestamptz NULL,
      email_change_token_current varchar(255) NULL,
      email_change_confirm_status smallint NULL,
      banned_until timestamptz NULL,
      reauthentication_token varchar(255) NULL,
      reauthentication_sent_at timestamptz NULL,
      is_sso_user bool NOT NULL DEFAULT false,
      deleted_at timestamptz NULL,
      is_anonymous bool NOT NULL DEFAULT false,
      CONSTRAINT users_pkey PRIMARY KEY (id)
    );

    CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);
    CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users USING btree (instance_id, lower(email));
    CREATE INDEX IF NOT EXISTS confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE confirmation_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS recovery_token_idx ON auth.users USING btree (recovery_token) WHERE recovery_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE email_change_token_current IS NOT NULL;
    CREATE INDEX IF NOT EXISTS email_change_token_new_idx ON auth.users USING btree (email_change_token) WHERE email_change_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE reauthentication_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS users_is_anonymous_idx ON auth.users USING btree (is_anonymous);
  `)

  if (includeIdentities) {
    await db.executeQuery(`
      CREATE TABLE IF NOT EXISTS auth.identities (
        id text NOT NULL,
        user_id uuid NOT NULL,
        identity_data jsonb NOT NULL,
        provider text NOT NULL,
        last_sign_in_at timestamptz NULL,
        created_at timestamptz NULL,
        updated_at timestamptz NULL,
        CONSTRAINT identities_pkey PRIMARY KEY (provider, id)
      );

      CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities USING btree (user_id);
    `)
  }
}
