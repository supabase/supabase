import dynamic from 'next/dynamic'
import { projectKeys } from './Connect.types'

interface ConnectContentTabProps {
  projectKeys: projectKeys
  filePath: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
  const ContentFile = dynamic<ConnectContentTabProps>(() => import(`./content/${filePath}/content`))

  return (
    <ContentFile projectKeys={projectKeys} filePath={filePath} />

    // <div className="bg-surface-300 p-4">
    //   <ConnectPath path={destinationLocation} />
    //   <ContentFile pooler={pooler} projectKeys={projectKeys} />
    // </div>
  )
}

export default ConnectTabContentNew
