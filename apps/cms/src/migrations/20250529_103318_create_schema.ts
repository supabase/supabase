import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    CREATE SCHEMA IF NOT EXISTS "cms-payload";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`
    DROP SCHEMA IF EXISTS "cms-payload" CASCADE;
  `)
} 