import roles from './pg-meta-roles'
import schemas from './pg-meta-schemas'
import * as functions from './pg-meta-functions'
import tablePrivileges from './pg-meta-table-privileges'
import materializedViews from './pg-meta-materialized-views'
import foreignTables from './pg-meta-foreign-tables'

export default {
  roles,
  schemas,
  functions,
  tablePrivileges,
  materializedViews,
  foreignTables,
}
