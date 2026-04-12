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
import types from './pg-meta-types'
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

export { ident, literal, keyword, safeSql, joinSqlFragments } from './pg-format'
export type { SafeSqlFragment } from './pg-format'

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
