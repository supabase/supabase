import roles from './pg-meta-roles'
import columns from './pg-meta-columns'
import schemas from './pg-meta-schemas'
import * as tables from './pg-meta-tables'
import * as functions from './pg-meta-functions'
import tablePrivileges from './pg-meta-table-privileges'
import materializedViews from './pg-meta-materialized-views'
import foreignTables from './pg-meta-foreign-tables'
import views from './pg-meta-views'
import policies from './pg-meta-policies'
import triggers from './pg-meta-triggers'
import types from './pg-meta-types'
import version from './pg-meta-version'
import indexes from './pg-meta-indexes'
import columnPrivileges from './pg-meta-column-privileges'

export default {
  roles,
  columns,
  schemas,
  tables,
  functions,
  tablePrivileges,
  materializedViews,
  foreignTables,
  views,
  policies,
  triggers,
  types,
  version,
  indexes,
  columnPrivileges,
}
