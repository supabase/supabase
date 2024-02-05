import dynamic from 'next/dynamic'
import { projectKeys } from './Connect.types'

interface ConnectContentTabProps {
  projectKeys: projectKeys
  filePath: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
  const ContentFile = dynamic<ConnectContentTabProps>(() => import(`./content/${filePath}/content`))

  return <ContentFile projectKeys={projectKeys} filePath={filePath} />
}

export default ConnectTabContentNew
