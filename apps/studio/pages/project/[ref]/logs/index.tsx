import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { FeatureFlagContext, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [lastVisitedLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    'explorer'
  )

  useEffect(() => {
    if (hasLoaded && !isUnifiedLogsEnabled) {
      router.replace(`/project/${ref}/logs/${lastVisitedLogsPage}`)
    }
  }, [router, hasLoaded, lastVisitedLogsPage, ref, isUnifiedLogsEnabled])

  // Handle redirects when unified logs preview flag changes
  useEffect(() => {
    // Only handle redirects if we're currently on a logs page
    if (!router.asPath.includes('/logs') || !hasLoaded) return

    if (isUnifiedLogsEnabled) {
      // If unified logs preview is enabled and we're not already on the main logs page
      if (router.asPath !== `/project/${ref}/logs` && router.asPath.includes('/logs/')) {
        router.push(`/project/${ref}/logs`)
      }
    } else {
      // If unified logs preview is disabled and admin flag is also off
      // and we're on the main logs page, redirect to explorer
      if (router.asPath === `/project/${ref}/logs`) {
        router.push(`/project/${ref}/logs/explorer`)
      }
    }
  }, [isUnifiedLogsEnabled, router, ref, hasLoaded])

  if (isUnifiedLogsEnabled) {
    return (
      <DefaultLayout>
        <ProjectLayout>
          <UnifiedLogs />
        </ProjectLayout>
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
