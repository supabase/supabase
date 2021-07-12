import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement } from 'react'

export default function AuthLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const { isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  const buildSidebar = () => {
    return [
      {
        label: 'General',
        links: [
          { label: 'Users', href: '/auth/users' },
          { label: 'Policies', href: '/auth/policies' },
        ],
      },
      {
        label: 'Settings',
        links: [{ label: 'Settings', href: '/auth/settings' }],
      },
    ]
  }

  return (
    <DashboardLayout
      title={title || 'Authentication'}
      sidebar={{ title: 'Authentication', categories: buildSidebar() }}
    >
      {children}
    </DashboardLayout>
  )
}
