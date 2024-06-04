import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Extensions } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import type { NextPageWithLayout } from 'types'

const DatabaseExtensions: NextPageWithLayout = () => {
  const canReadExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'extensions'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadExtensions) {
    return <NoPermission isFullPage resourceText="view database extensions" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="Database Extensions" />
          <Extensions />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseExtensions.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabaseExtensions
