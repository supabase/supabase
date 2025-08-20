import { type PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { cn } from 'ui'

const OrganizationLayoutContent = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className={cn('w-full flex flex-col overflow-hidden')}>
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  )
}

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  return <OrganizationLayoutContent>{children}</OrganizationLayoutContent>
}

export default withAuth(OrganizationLayout)
