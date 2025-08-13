import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { FeatureFlagContext, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)

  const { data: org } = useSelectedOrganizationQuery()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [lastVisitedLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    'explorer'
  )

  useEffect(() => {
    if (hasLoaded && !!org && !isUnifiedLogsEnabled) {
      router.replace(`/project/${ref}/logs/${lastVisitedLogsPage}`)
    }
  }, [router, hasLoaded, org, lastVisitedLogsPage, ref, isUnifiedLogsEnabled])

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
