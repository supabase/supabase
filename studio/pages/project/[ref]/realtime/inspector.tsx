import { NextPageWithLayout } from 'types'

import { RealtimeInspector } from 'components/interfaces/Realtime/Inspector'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { useCheckPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import ProjectLayout from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'

export const InspectorPage: NextPageWithLayout = () => {
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  if (!canReadAPIKeys) {
    return <NoPermission isFullPage resourceText="access your project's realtime functionalities" />
  }

  return <RealtimeInspector />
}

InspectorPage.getLayout = (page) => <RealtimeLayout title="Realtime">{page}</RealtimeLayout>

export default InspectorPage
