import dynamic from 'next/dynamic'
import ConnectPath from './ConnectPath'

interface ConnectContentTabProps {
  path: string
}

const ConnectTabContent = ({ path }: ConnectContentTabProps) => {
  console.log({ path })
  const ContentFile = dynamic(() => import(`./content/${path}`))

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={path} />
      <ContentFile />
    </div>
  )
}

export default ConnectTabContent
