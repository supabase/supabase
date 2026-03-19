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

// Studio SQL queries
export {
  getUserSQL,
  getIndexStatusesSQL,
  getUsersCountSQL,
  getPaginatedUsersSQL,
  getIndexWorkerStatusSQL,
  USER_SEARCH_INDEXES,
  type OptimizedSearchColumns,
  type UsersCursor,
} from './sql/studio/auth'
export {
  getLargestSizeLimitBucketsSqlUnoptimized,
  LARGEST_SIZE_LIMIT_BUCKETS_COUNT,
} from './sql/studio/storage'
export {
  getExposedTablesSql,
  getExposedTableCountsSql,
  getExposedFunctionsSql,
  getExposedFunctionCountsSql,
  buildTablePrivilegesSql,
  buildFunctionPrivilegesSql,
  buildDefaultPrivilegesSql,
  getDefaultPrivilegesStateSql,
} from './sql/studio/privileges'
export {
  getIndexesSQL,
  getDatabaseExtensionDefaultSchemaSQL,
  getCronJobsMinimalSql,
  getCronJobsSql,
  getJobRunDetailsPageCountSql,
  getDeleteOldCronJobRunDetailsByCtidSql,
  getScheduleDeleteCronJobRunDetailsSql,
  getTableRowsCountSql,
} from './sql/studio/database'
export {
  type ForeignKey,
  FOREIGN_KEY_CASCADE_ACTION,
  getAddPrimaryKeySQL,
  getDropConstraintSQL,
  getAddForeignKeySQL,
  getRemoveForeignKeySQL,
  getUpdateIdentitySequenceSQL,
  getDuplicateIdentitySequenceSQL,
  getDuplicateTableSQL,
  getDuplicateRowsSQL,
  getEnableRLSSQL,
} from './sql/studio/table-editor'

export { getLiveTupleEstimate } from './sql/studio/get-live-tuple-estimate'

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
