import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import { ProjectLayout } from '@/components/layouts/ProjectLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { withAuth } from '@/hooks/misc/withAuth'

export const Route = createFileRoute('/project/$ref/logs/')({
  component: LogsIndexRoute,
  staticData: {
    // Page body wraps in its own <ProjectLayout> conditionally; LogsLayout
    // is not appropriate here.
    skipLogsLayout: true,
  },
})

const LogPageWithAuth = withAuth(LogPage)

function LogsIndexRoute() {
  return <LogPageWithAuth />
}

function LogPage() {
  const navigate = useNavigate()
  const { ref } = useParams()

  const logsEnabled = useIsFeatureEnabled('logs:all')
  const { isEnabled: isUnifiedLogsEnabled, isLoading } = useUnifiedLogsPreview()

  useEffect(() => {
    if (logsEnabled && !isLoading && !isUnifiedLogsEnabled && ref) {
      void navigate({ to: '/project/$ref/logs/explorer', params: { ref }, replace: true })
    }
  }, [logsEnabled, isLoading, isUnifiedLogsEnabled, ref, navigate])

  if (!logsEnabled) {
    return (
      <ProjectLayout browserTitle={{ section: 'Logs' }}>
        <UnknownInterface urlBack={`/project/${ref}`} />
      </ProjectLayout>
    )
  }

  if (isUnifiedLogsEnabled) {
    return (
      // Omit the generic product segment here; project/org context already makes the route clear.
      <ProjectLayout browserTitle={{ section: 'Unified Logs' }}>
        <UnifiedLogs />
      </ProjectLayout>
    )
  }

  return null
}
