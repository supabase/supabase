import dynamic from 'next/dynamic'
import { projectKeys } from './Connect.types'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'

interface ConnectContentTabProps {
  projectKeys: projectKeys
  filePath: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
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
      <ContentFile projectKeys={projectKeys} filePath={filePath} />
    </div>
  )
}

export default ConnectTabContentNew
