import DashboardLayout from '../../components/layouts/DashboardLayout'
import { ReactElement } from 'react'

export default function AuthLayout({ title, children }: { title: string; children: ReactElement }) {
  return (
    <DashboardLayout
      title={title || 'Authentication'}
      sidebar={{
        title: 'Authentication',
        categories: [
          {
            label: 'General',
            links: [
              { label: 'Users', href: '/auth/users' },
              { label: 'Policies', href: '/auth/policies' },
              { label: 'Templates', href: '/auth/templates' },
            ],
          },
          {
            label: 'Settings',
            links: [{ label: 'Settings', href: '/auth/settings' }],
          },
        ],
      }}
    >
      {children}
    </DashboardLayout>
  )
}
