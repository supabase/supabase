import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PropsWithChildren, useEffect } from 'react'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { SaveQueueActionBar } from '@/components/grid/components/footer/operations/SaveQueueActionBar'
import {
  useIsQueueOperationsEnabled,
  useIsTableFilterBarEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BannerTableEditorFilter } from '@/components/ui/BannerStack/Banners/BannerTableEditorFilter'
import { BannerTableEditorQueueOperations } from '@/components/ui/BannerStack/Banners/BannerTableEditorQueueOperations'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { addBanner, dismissBanner } = useBannerStack()
  const isTableFilterBarEnabled = useIsTableFilterBarEnabled()
  const isTableQueueOperationsEnabled = useIsQueueOperationsEnabled()

  const [isTableEditorNewFilterBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_NEW_FILTER_BANNER_DISMISSED(ref ?? ''),
    false
  )

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

    if (canReadTables && !isTableEditorNewFilterBannerDismissed && !isTableFilterBarEnabled) {
      addBanner({
        id: 'table-editor-new-filter-banner',
        priority: 3,
        isDismissed: false,
        content: <BannerTableEditorFilter />,
      })
    } else {
      dismissBanner('table-editor-new-filter-banner')
    }

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
      dismissBanner('table-editor-new-filter-banner')
      dismissBanner('table-editor-queue-operations-banner')
    }
  }, [
    addBanner,
    dismissBanner,
    canReadTables,
    isPermissionsLoaded,
    isTableEditorNewFilterBannerDismissed,
    isTableFilterBarEnabled,
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
