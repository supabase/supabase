import roles from './pg-meta-roles'
import schemas from './pg-meta-schemas'
import * as functions from './pg-meta-functions'
import tablePrivileges from './pg-meta-table-privileges'
import policies from './pg-meta-policies'
import triggers from './pg-meta-triggers'
import types from './pg-meta-types'
import version from './pg-meta-version'
import indexes from './pg-meta-indexes'
import columnPrivileges from './pg-meta-column-privileges'

export default {
  roles,
  schemas,
  functions,
  tablePrivileges,
  policies,
  triggers,
  types,
  version,
  indexes,
  columnPrivileges,
}
