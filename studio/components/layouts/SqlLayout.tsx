import DashboardLayout from '../../components/layouts/DashboardLayout'
import { ReactElement } from 'react'

export default function SqlLayout({ title, children }: { title: string; children: ReactElement }) {
  return (
    <DashboardLayout
      title={title || 'SQL'}
      sidebar={{
        title: 'SQL',
        categories: [
          {
            label: 'Getting started',
            links: [
              { label: 'Welcome', href: '/sql' },
            ],
          }
        ],
      }}
    >
      {children}
    </DashboardLayout>
  )
}
