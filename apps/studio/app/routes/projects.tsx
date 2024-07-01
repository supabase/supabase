import { Outlet } from '@remix-run/react'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'

export default function Projects() {
  return (
    <AccountLayout
      title="Dashboard"
      breadcrumbs={[
        {
          key: `supabase-projects`,
          label: 'Projects',
        },
      ]}
    >
      <Outlet />
    </AccountLayout>
  )
}
