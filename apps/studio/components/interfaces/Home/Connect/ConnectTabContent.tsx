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
  const ContentFile = dynamic(() => import(`./content/${path}`))

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={destinationLocation} />
      {/* @ts-expect-error */}
      <ContentFile pooler={pooler} />
    </div>
  )
}

export default ConnectTabContent
