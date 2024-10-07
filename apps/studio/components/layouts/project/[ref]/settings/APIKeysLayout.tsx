import { PropsWithChildren } from 'react'
import { withAuth } from 'hooks/misc/withAuth'

const APiKeysLayout = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default withAuth(APiKeysLayout)
