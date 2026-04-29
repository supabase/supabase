import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { PropsWithChildren, useEffect } from 'react'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { SaveQueueActionBar } from '@/components/grid/components/footer/operations/SaveQueueActionBar'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { BannerTableEditorQueueOperations } from '@/components/ui/BannerStack/Banners/BannerTableEditorQueueOperations'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { addBanner, dismissBanner } = useBannerStack()
  const isTableQueueOperationsEnabled = useIsQueueOperationsEnabled()

  const [isTableEditorQueueOperationsBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_QUEUE_OPERATIONS_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const { can: canReadTables, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'tables'
  )

  const { can: canWriteTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  useEffect(() => {
    if (!isPermissionsLoaded) return

    if (
      canWriteTables &&
      !isTableEditorQueueOperationsBannerDismissed &&
      !isTableQueueOperationsEnabled
    ) {
      addBanner({
        id: 'table-editor-queue-operations-banner',
        priority: 2,
        isDismissed: false,
        content: <BannerTableEditorQueueOperations />,
      })
    } else {
      dismissBanner('table-editor-queue-operations-banner')
    }

    return () => {
      dismissBanner('table-editor-queue-operations-banner')
    }
  }, [
    addBanner,
    dismissBanner,
    isPermissionsLoaded,
    canWriteTables,
    isTableEditorQueueOperationsBannerDismissed,
    isTableQueueOperationsEnabled,
  ])

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <>
      {children}
      <SaveQueueActionBar />
    </>
  )
}
