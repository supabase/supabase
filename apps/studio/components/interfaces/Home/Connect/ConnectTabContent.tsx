import { useParams } from 'common'
import dynamic from 'next/dynamic'

import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { projectKeys } from './Connect.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

interface ConnectContentTabProps {
  projectRef?: string
  region?: string
  projectKeys: projectKeys
  filePath: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const ContentFile = dynamic<ConnectContentTabProps>(
    () => import(`./content/${filePath}/content`),
    {
      loading: () => (
        <div className="p-4 min-h-[331px]">
          <GenericSkeletonLoader />
        </div>
      ),
    }
  )

  return (
    <div className="border rounded-lg">
      <ContentFile
        projectRef={ref}
        region={project?.region}
        projectKeys={projectKeys}
        filePath={filePath}
      />
    </div>
  )
}

export default ConnectTabContentNew
