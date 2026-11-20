/**
 * TEMPORARY. Delete once Spark (turso) runs `publications.list`, which fails there on
 * `json_build_object`.
 */
import { toBool, toInt, type CatalogQuery } from '../catalog-fallback'
import { literal, safeSql } from '../pg-format'

/** Fallback for `publications.list`. */
export async function listPublicationsFallback(
  query: CatalogQuery,
  { limit, offset }: { limit?: number; offset?: number } = {}
) {
  const [publications, members] = await Promise.all([
    query(safeSql`
      select p.oid::int8 as id, p.pubname as name, r.rolname as owner, p.pubinsert, p.pubupdate,
        p.pubdelete, p.pubtruncate, p.puballtables
      from pg_catalog.pg_publication p
      left join pg_catalog.pg_roles r on r.oid = p.pubowner
      ${limit ? safeSql`limit ${literal(limit)}` : safeSql``}
      ${offset ? safeSql`offset ${literal(offset)}` : safeSql``}`),
    query(safeSql`
      select pr.prpubid::int8 as publication_id, c.oid::int8 as id, c.relname as name, n.nspname as schema
      from pg_catalog.pg_publication_rel pr
      join pg_catalog.pg_class c on c.oid = pr.prrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace`),
  ])
  return publications.map((row) => ({
    id: toInt(row.id),
    name: String(row.name),
    owner: String(row.owner),
    publish_insert: toBool(row.pubinsert),
    publish_update: toBool(row.pubupdate),
    publish_delete: toBool(row.pubdelete),
    publish_truncate: toBool(row.pubtruncate),
    tables: toBool(row.puballtables)
      ? null
      : members
          .filter((member) => toInt(member.publication_id) === toInt(row.id))
          .map((member) => ({
            id: toInt(member.id),
            name: String(member.name),
            schema: String(member.schema),
          })),
  }))
}
