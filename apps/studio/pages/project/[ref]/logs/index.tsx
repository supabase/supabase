import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  useEffect(() => {
    if (!isUnifiedLogsEnabled && ref) {
      router.replace(`/project/${ref}/logs/explorer`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnifiedLogsEnabled, ref])

  if (isUnifiedLogsEnabled) {
    return (
      <DefaultLayout>
        <ProjectLayout>
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
