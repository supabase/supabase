import dynamic from 'next/dynamic'
import ConnectPath from './ConnectPath'

interface ConnectContentTabProps {
  path: string
  destinationLocation: string
  pooler?: boolean
}

const ConnectTabContent = ({
  path,
  destinationLocation,
  pooler = false,
}: ConnectContentTabProps) => {
  const ContentFile = dynamic<{ pooler: boolean }>(() => import(`./content/${path}`))

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={destinationLocation} />
      <ContentFile pooler={pooler} />
    </div>
  )
}

export default ConnectTabContent
