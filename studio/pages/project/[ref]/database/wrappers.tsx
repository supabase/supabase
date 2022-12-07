import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Wrappers } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { FormsContainer } from 'components/ui/Forms'

const DatabaseWrappers: NextPageWithLayout = () => {
  const canReadWrappers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'wrappers')
  if (!canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <Wrappers />
}

DatabaseWrappers.getLayout = (page) => (
  <DatabaseLayout title="Wrappers">
    <FormsContainer>{page}</FormsContainer>
  </DatabaseLayout>
)

export default observer(DatabaseWrappers)
