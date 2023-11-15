import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'

import { Wrappers } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const DatabaseWrappers: NextPageWithLayout = () => {
  const canReadWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')
  if (!canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <Wrappers />
}

DatabaseWrappers.getLayout = (page) => (
  <DatabaseLayout title="Wrappers">
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">{page}</div>
      </ScaffoldSection>
    </ScaffoldContainer>
  </DatabaseLayout>
)

export default observer(DatabaseWrappers)
