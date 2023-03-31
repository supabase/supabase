import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { FC, ReactNode } from 'react'
import { AccountLayout } from './'

interface Props {
  children: ReactNode
}

const OrganizationLayout: FC<Props> = ({ children }) => {
  const { ui } = useStore()

  return (
    <AccountLayout
      title={ui.selectedOrganization?.name ?? 'Supabase'}
      breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
    >
      {children}
    </AccountLayout>
  )
}

export default observer(OrganizationLayout)
