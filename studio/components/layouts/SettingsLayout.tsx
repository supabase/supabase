import DashboardLayout from '../../components/layouts/DashboardLayout'
import { ReactElement } from 'react'

export default function SettingsLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const buildSidebar = () => {
    return [
      {
        label: 'Project',
        links: [
          { label: 'General', href: '/settings/general' },
          { label: 'Database', href: '/settings/database' },
          { label: 'API', href: '/settings/api' },
          { label: 'Auth Settings', href: '/auth/settings' },
          { label: 'Billing & Usage', href: '/settings/billing' },
        ],
      },
    ]
  }

  return (
    <DashboardLayout
      title={title || 'Settings'}
      sidebar={{
        title: 'Settings',
        categories: buildSidebar(),
      }}
    >
      {children}
    </DashboardLayout>
  )
}
