import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "_customers_v_autosave_idx";
  DROP INDEX "_events_v_autosave_idx";
  DROP INDEX "_posts_v_autosave_idx";
  ALTER TABLE "_customers_v" DROP COLUMN "autosave";
  ALTER TABLE "_events_v" DROP COLUMN "autosave";
  ALTER TABLE "_posts_v" DROP COLUMN "autosave";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_customers_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_events_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "autosave" boolean;
  CREATE INDEX "_customers_v_autosave_idx" ON "_customers_v" USING btree ("autosave");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");`)
}
