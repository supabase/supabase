import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  useFeaturePreviewContext,
  useIsUnifiedLogsEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import UnifiedLogsLayout from 'components/layouts/UnifiedLogsLayout/UnifiedLogsLayout'
import { useFlag } from 'hooks/ui/useFlag'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const unifiedLogsAdminEnabled = useFlag('unifiedLogs')
  const unifiedLogsPreview = useIsUnifiedLogsEnabled()

  // Check if unified logs should be shown (either admin enabled or user enabled preview)
  const showUnifiedLogs = unifiedLogsAdminEnabled || unifiedLogsPreview

  const [lastVisitedLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    'explorer'
  )

  useEffect(() => {
    if (!showUnifiedLogs) {
      router.replace(`/project/${ref}/logs/${lastVisitedLogsPage}`)
    }
  }, [router, lastVisitedLogsPage, ref, showUnifiedLogs])

  // Handle redirects when unified logs preview flag changes
  useEffect(() => {
    // Only handle redirects if we're currently on a logs page
    if (!router.asPath.includes('/logs')) return

    if (unifiedLogsPreview) {
      // If unified logs preview is enabled and we're not already on the main logs page
      if (router.asPath !== `/project/${ref}/logs` && router.asPath.includes('/logs/')) {
        router.push(`/project/${ref}/logs`)
      }
    } else if (!unifiedLogsAdminEnabled) {
      // If unified logs preview is disabled and admin flag is also off
      // and we're on the main logs page, redirect to explorer
      if (router.asPath === `/project/${ref}/logs`) {
        router.push(`/project/${ref}/logs/explorer`)
      }
    }
  }, [unifiedLogsPreview, unifiedLogsAdminEnabled, router, ref])

  if (showUnifiedLogs) {
    return (
      <DefaultLayout>
        <UnifiedLogsLayout>
          <UnifiedLogs />
        </UnifiedLogsLayout>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout>
      <LogsLayout>
        {/* Empty placeholder - the useEffect will handle redirect */}
        <div></div>
      </LogsLayout>
    </DefaultLayout>
  )
}

// Don't use getLayout since we're handling layouts conditionally within the component
LogPage.getLayout = (page) => page

export default LogPage
