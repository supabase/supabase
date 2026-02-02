import { PropsWithChildren } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import DatabaseLayout from './DatabaseLayout'

type DatabaseTriggersLayoutProps = PropsWithChildren

const DatabaseTriggersLayout = ({ children }: DatabaseTriggersLayoutProps) => {
  const { ref } = useParams()
  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const navigationItems = [
    {
      label: 'Data',
      href: `/project/${ref}/database/triggers/data`,
    },
    {
      label: 'Event',
      href: `/project/${ref}/database/triggers/event`,
    },
  ]

  return (
    <DatabaseLayout title="Database">
      {isPermissionsLoaded && !canReadTriggers ? (
        <NoPermission isFullPage resourceText="view database triggers" />
      ) : (
        <PageLayout
          title="Database Triggers"
          subtitle="Execute actions automatically when database events occur"
          navigationItems={navigationItems}
          size="large"
        >
          {children}
        </PageLayout>
      )}
    </DatabaseLayout>
  )
}

export default DatabaseTriggersLayout
