import columnPrivileges from './pg-meta-column-privileges'
import columns from './pg-meta-columns'
import config from './pg-meta-config'
import extensions from './pg-meta-extensions'
import foreignTables from './pg-meta-foreign-tables'
import * as functions from './pg-meta-functions'
import indexes from './pg-meta-indexes'
import materializedViews from './pg-meta-materialized-views'
import policies from './pg-meta-policies'
import publications from './pg-meta-publications'
import roles from './pg-meta-roles'
import schemas from './pg-meta-schemas'
import tablePrivileges from './pg-meta-table-privileges'
import * as tables from './pg-meta-tables'
import triggers from './pg-meta-triggers'
import * as types from './pg-meta-types'
import version from './pg-meta-version'
import views from './pg-meta-views'
import * as query from './query/index'

/**
 * Studio specific SQL queries
 * [Joshen] If it gets cumbersome, we can also consider path exports for studio queries
 * So consumption can look something like:
 * import { ... } from '@supabase/pg-meta/table-editor'
 */
export * from './sql/studio/advisor'
export * from './sql/studio/auth'
export * from './sql/studio/storage'
export * from './sql/studio/database'
export * from './sql/studio/table-editor'
export * from './sql/studio/sql-editor'
export * from './sql/studio/role-impersonation'
export * from './sql/studio/integrations'

// TEMPORARY fallbacks for a partial pg_catalog (Spark on turso); see `catalog-fallback.ts`.
export {
  isCatalogGap,
  isDoBlockGap,
  isPopulateRecordGap,
  withCatalogFallback,
  type CatalogQuery,
  type CatalogRow,
} from './catalog-fallback'
export {
  listTablesFallback,
  listTablesPaginatedFallback,
  retrieveTableFallback,
} from './sql/tables.fallback'
export { withParsedPolicyRoles } from './sql/policies.fallback'
export {
  getTablePrivilegesStatementsFallback,
  listTablePrivilegesFallback,
} from './sql/table-privileges.fallback'
export type { TablePrivilegesGrant, TablePrivilegesRevoke } from './pg-meta-table-privileges'
export { getTableEditorFallback } from './sql/studio/table-editor/table.fallback'
export { getEntityTypesFallback } from './sql/studio/table-editor/entities.fallback'
export { getMigrationsFallback } from './sql/studio/database/migrations.fallback'
export { getTableRowsCountFallback } from './sql/studio/database/rows.fallback'
export { getTableRowsFallback } from './query/table-row-query.fallback'
export { readColumnFormats, type ColumnFormat } from './query/write-values.fallback'

export {
  ident,
  literal,
  keyword,
  safeSql,
  rawSql,
  untrustedSql,
  acceptUntrustedSql,
  joinSqlFragments,
  asWriteSql,
} from './pg-format'
export type {
  WriteSqlFragment,
  SafeSqlFragment,
  UntrustedSqlFragment,
  DisplayableSqlFragment,
} from './pg-format'

export type { PGTable, PGTablePrimaryKey, PGTableRelationship } from './pg-meta-tables'
export type { PGColumn } from './pg-meta-columns'
export type { PGPolicy } from './pg-meta-policies'
export type { PGTrigger, PGTriggerCreate, PGTriggerUpdate } from './pg-meta-triggers'
export type { PGView } from './pg-meta-views'
export type { PGMaterializedView } from './pg-meta-materialized-views'
export type { PGForeignTable } from './pg-meta-foreign-tables'
export type { PGSchema } from './pg-meta-schemas'
export type { PGPublication } from './pg-meta-publications'
export type { PGType } from './pg-meta-types'

export default {
  roles,
  columns,
  schemas,
  tables,
  functions,
  tablePrivileges,
  publications,
  extensions,
  config,
  materializedViews,
  foreignTables,
  views,
  policies,
  triggers,
  types,
  version,
  indexes,
  columnPrivileges,
  query,
}
