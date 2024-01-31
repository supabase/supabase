import dynamic from 'next/dynamic'
import ConnectPath from './ConnectPath'
import { projectKeys } from './Connect.types'

interface ContentFileProps {
  pooler: boolean
  projectKeys: projectKeys
}

interface ConnectContentTabProps {
  path: string
  destinationLocation: string
  pooler?: boolean
  projectKeys: projectKeys
}

const ConnectTabContent = ({
  path,
  destinationLocation,
  pooler = false,
  projectKeys,
}: ConnectContentTabProps) => {
  const ContentFile = dynamic<ContentFileProps>(() => import(`./content/${path}`))

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={destinationLocation} />
      <ContentFile pooler={pooler} projectKeys={projectKeys} />
    </div>
  )
}

export default ConnectTabContent
