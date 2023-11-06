import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'

import { Extensions } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const DatabaseExtensions: NextPageWithLayout = () => {
  const canReadExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'extensions'
  )
  if (!canReadExtensions) {
    return <NoPermission isFullPage resourceText="view database extensions" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <h3 className="mb-4 text-xl text-foreground">Database Extensions</h3>
          <Extensions />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseExtensions.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseExtensions)
