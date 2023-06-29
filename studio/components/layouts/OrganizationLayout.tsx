import { useSelectedOrganization } from 'hooks'
import { PropsWithChildren } from 'react'
import AccountLayout from './AccountLayout/AccountLayout'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()

  return (
    <AccountLayout
      title={selectedOrganization?.name ?? 'Supabase'}
      breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
    >
      {children}
    </AccountLayout>
  )
}

export default OrganizationLayout
