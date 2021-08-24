import DashboardLayout from '../../components/layouts/DashboardLayout'
import { ReactElement } from 'react'

export default function DatabaseLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const buildSidebar = () => {
    return [
      {
        label: 'Database',
        links: [
          { label: 'Tables', href: '/database/tables' },
          { label: 'Roles', href: '/database/roles' },
          { label: 'Extensions', href: '/database/extensions' },
          { label: 'Replication', href: '/database/replication' },
        ],
      },
      {
        label: 'Settings',
        links: [
          { label: 'Backups', href: '/database/backups' },
          { label: 'Connection Pooling', href: '/database/pooling' },
        ],
      },
    ]
  }

  return (
    <DashboardLayout
      title={title || 'Database'}
      sidebar={{
        title: 'Database',
        categories: buildSidebar(),
      }}
    >
      {children}
    </DashboardLayout>
  )
}
