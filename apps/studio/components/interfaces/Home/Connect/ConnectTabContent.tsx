import dynamic from 'next/dynamic'
import ConnectPath from './ConnectPath'

interface ConnectContentTabProps {
  path: string
  pooler?: boolean
}

const ConnectTabContent = ({ path, pooler = false }: ConnectContentTabProps) => {
  const ContentFile = dynamic(() => import(`./content/${path}`))

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={path} />
      {/* @ts-ignore */}
      <ContentFile pooler={pooler} />
    </div>
  )
}

export default ConnectTabContent
