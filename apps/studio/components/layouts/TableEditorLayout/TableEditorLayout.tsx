import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PropsWithChildren, useEffect } from 'react'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { SaveQueueActionBar } from '@/components/grid/components/footer/operations/SaveQueueActionBar'
import { BannerTableEditorFilter } from '@/components/ui/BannerStack/Banners/BannerTableEditorFilter'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const TABLE_EDITOR_NEW_FILTER_BANNER_ID = 'table-editor-new-filter-banner'

export const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { addBanner, dismissBanner } = useBannerStack()

  const [isTableEditorNewFilterBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_NEW_FILTER_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const { can: canReadTables, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'tables'
  )

  useEffect(() => {
    if (!isPermissionsLoaded) return

    if (canReadTables && !isTableEditorNewFilterBannerDismissed) {
      addBanner({
        id: TABLE_EDITOR_NEW_FILTER_BANNER_ID,
        priority: 2,
        isDismissed: false,
        content: <BannerTableEditorFilter />,
      })
    } else {
      dismissBanner(TABLE_EDITOR_NEW_FILTER_BANNER_ID)
    }

    return () => {
      dismissBanner(TABLE_EDITOR_NEW_FILTER_BANNER_ID)
    }
  }, [
    addBanner,
    dismissBanner,
    canReadTables,
    isPermissionsLoaded,
    isTableEditorNewFilterBannerDismissed,
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
