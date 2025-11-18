import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import ObservabilityMenu from './ObservabilityMenu'

interface ObservabilityLayoutProps {
  title?: string
}

const ObservabilityLayout = ({ title, children }: PropsWithChildren<ObservabilityLayoutProps>) => {
  const { ref } = useParams()
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  if (reportsAll) {
    return (
      <ProjectLayout
        title={title}
        product="Observability"
        productMenu={<ObservabilityMenu />}
        isBlocking={false}
      >
        {children}
      </ProjectLayout>
    )
  } else {
    return <UnknownInterface urlBack={`/project/${ref}`} />
  }
}

export default withAuth(ObservabilityLayout)
