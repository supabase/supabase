import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "authors" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "authors" ADD COLUMN "company" varchar;
  CREATE UNIQUE INDEX "authors_author_id_idx" ON "authors" USING btree ("author_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "authors_author_id_idx";
  ALTER TABLE "authors" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "authors" DROP COLUMN "company";`)
}
