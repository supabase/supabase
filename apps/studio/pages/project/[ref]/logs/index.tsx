import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
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

// DefaultLayout lives at the framework wrapper level, not in the page
// body — both runtimes provide it externally (Next via `getLayout`,
// TanStack via the parent `routes/project/$ref.tsx` shell). Wrapping it
// inline would double-mount its SidebarProvider/ProjectContextProvider
// chain under TanStack since the shell already supplies one.
LogPage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default LogPage
