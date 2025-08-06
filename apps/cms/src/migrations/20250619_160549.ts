import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        INSERT INTO storage.buckets (id, name, public) VALUES ('cms', 'cms', false)
        ON CONFLICT (id) DO NOTHING;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DELETE FROM storage.objects WHERE bucket_id = 'cms';
        DELETE FROM storage.buckets WHERE id = 'cms';
    `)
}