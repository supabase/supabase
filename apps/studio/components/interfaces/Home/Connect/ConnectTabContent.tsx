import { useParams } from 'common'
import dynamic from 'next/dynamic'

import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { projectKeys } from './Connect.types'

interface ConnectContentTabProps {
  projectRef?: string
  projectKeys: projectKeys
  filePath: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
  const { ref } = useParams()
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
      <ContentFile projectRef={ref} projectKeys={projectKeys} filePath={filePath} />
    </div>
  )
}

export default ConnectTabContentNew
