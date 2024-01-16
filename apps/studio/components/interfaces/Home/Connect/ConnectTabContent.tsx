import CopyButton from 'components/ui/CopyButton'

import dynamic from 'next/dynamic'
import ConnectPath from './ConnectPath'

interface ConnectContentTabProps {
  path: string
}

const ConnectTabContent = ({ path }: ConnectContentTabProps) => {
  const ContentFile = dynamic(() => import(`./content/${path}`), {
    loading: (path) => <p>loading</p>,
  })

  return (
    <div className="bg-surface-300 p-4">
      <ConnectPath path={'utils/supabase/client.tsx'} />
      <ContentFile />
    </div>
  )
}

export default ConnectTabContent
