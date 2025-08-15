import { type PropsWithChildren } from 'react'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { cn } from 'ui'
import { setOrganizationCookie } from '../../data/vela/vela'

const OrganizationLayoutContent = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  if (selectedOrganization) {
    setOrganizationCookie(selectedOrganization.id)
  }

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
