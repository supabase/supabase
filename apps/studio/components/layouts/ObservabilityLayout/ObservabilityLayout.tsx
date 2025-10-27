import { PropsWithChildren } from 'react'
import { ProjectLayout } from '../ProjectLayout/ProjectLayout'
import { useParams } from 'common'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import ObservabilityMenu from './ObservabilityMenu'

interface ObservabilityLayoutProps {
  title?: string
}

export const ObservabilityLayout = ({
  title,
  children,
}: PropsWithChildren<ObservabilityLayoutProps>) => {
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
