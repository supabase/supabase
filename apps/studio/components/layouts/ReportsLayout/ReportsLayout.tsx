import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import ReportsMenu from './ReportsMenu'

interface ReportsLayoutProps {
  title?: string
}

const ReportsLayout = ({ title, children }: PropsWithChildren<ReportsLayoutProps>) => {
  const { ref } = useParams()
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  if (reportsAll) {
    return (
      <ProjectLayout
        title={title}
        product="Reports"
        productMenu={<ReportsMenu />}
        isBlocking={false}
      >
        {children}
      </ProjectLayout>
    )
  } else {
    return <UnknownInterface urlBack={`/project/${ref}`} />
  }
}

export default withAuth(ReportsLayout)
