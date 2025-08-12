import { PermissionAction } from '@supabase/shared-types/out/constants'
import type { NextPageWithLayout } from 'types'

import { RealtimeInspector } from 'components/interfaces/Realtime/Inspector'
import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'

export const InspectorPage: NextPageWithLayout = () => {
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckProjectPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  if (isPermissionsLoaded && !canReadAPIKeys) {
    return <NoPermission isFullPage resourceText="access your project's realtime functionalities" />
  }

  return <RealtimeInspector />
}

InspectorPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Realtime Inspector">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default InspectorPage
