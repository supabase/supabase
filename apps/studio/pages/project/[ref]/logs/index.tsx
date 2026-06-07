import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { ProjectLayout } from '@/components/layouts/ProjectLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const logsEnabled = useIsFeatureEnabled('logs:all')
  const { isEnabled: isUnifiedLogsEnabled, isLoading } = useUnifiedLogsPreview()

  useEffect(() => {
    if (logsEnabled && !isLoading && !isUnifiedLogsEnabled && ref) {
      router.replace(`/project/${ref}/logs/explorer`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsEnabled, isLoading, isUnifiedLogsEnabled, ref])

  if (!logsEnabled) {
    return (
      <DefaultLayout>
        <ProjectLayout browserTitle={{ section: 'Logs' }}>
          <UnknownInterface urlBack={`/project/${ref}`} />
        </ProjectLayout>
      </DefaultLayout>
    )
  }

  if (isUnifiedLogsEnabled) {
    return (
      <DefaultLayout>
        {/* Omit the generic product segment here; project/org context already makes the route clear. */}
        <ProjectLayout browserTitle={{ section: 'Unified Logs' }}>
          <UnifiedLogs />
        </ProjectLayout>
      </DefaultLayout>
    )
  }

  return null
}

// Don't use getLayout since we're handling layouts conditionally within the component
LogPage.getLayout = (page) => page

export default LogPage
