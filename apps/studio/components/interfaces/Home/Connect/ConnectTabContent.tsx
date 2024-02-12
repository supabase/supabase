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
      loading: () => <GenericSkeletonLoader />,
    }
  )

  return <ContentFile projectKeys={projectKeys} filePath={filePath} />
}

export default ConnectTabContentNew
