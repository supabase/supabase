import { createSchemaProvisioner, type SchemaProvisioner } from '@hosted-supabase/schema-provisioner'
import { POSTGRES_DATABASE, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT } from './constants'
import { assertSelfHosted } from './util'

let instance: SchemaProvisioner | null = null

export function getProvisioner(): SchemaProvisioner {
  assertSelfHosted()
  if (!instance) {
    instance = createSchemaProvisioner({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      password: POSTGRES_PASSWORD,
      user: process.env.POSTGRES_USER ?? 'supabase_admin',
      jwtSecret: process.env.AUTH_JWT_SECRET ?? '',
    })
  }
  return instance
}
