import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "toc_depth" SET DEFAULT 3;
  ALTER TABLE "_posts_v" ALTER COLUMN "version_toc_depth" SET DEFAULT 3;
  CREATE INDEX "authors_author_idx" ON "authors" USING btree ("author");
  CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE INDEX "posts_title_idx" ON "posts" USING btree ("title");
  CREATE INDEX "_posts_v_version_version_title_idx" ON "_posts_v" USING btree ("version_title");
  CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "authors_author_idx";
  DROP INDEX "categories_name_idx";
  DROP INDEX "posts_title_idx";
  DROP INDEX "_posts_v_version_version_title_idx";
  DROP INDEX "tags_name_idx";
  ALTER TABLE "posts" ALTER COLUMN "toc_depth" SET DEFAULT 2;
  ALTER TABLE "_posts_v" ALTER COLUMN "version_toc_depth" SET DEFAULT 2;`)
}
