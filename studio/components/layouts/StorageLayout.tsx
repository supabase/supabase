import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement } from 'react'
import { Button, IconPlus } from '@supabase/ui'

export default function StorageLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  //TODO: get storage buckets
  const bucketNames: string[] = []

  const buildSidebar = (bucketNames: string[]) => {
    return [
      {
        label: 'All Buckets',
        links: bucketNames.map((name) => ({ label: name, href: `/storage/buckets/${name}` })),
      },
      {
        label: 'Settings',
        links: [
          { label: 'Policies', href: '/storage/policies' },
          { label: 'Usage', href: '/storage/usage' },
        ],
      },
    ]
  }

  const buildSidebarAction = () => {
    return (
      <Button icon={<IconPlus />} shadow={true} block type="text">
        New Bucket
      </Button>
    )
  }

  return (
    <DashboardLayout
      title={title || 'Storage'}
      sidebar={{
        title: 'Storage',
        categories: buildSidebar(bucketNames),
        searchable: true,
        action: buildSidebarAction(),
      }}
    >
      {children}
    </DashboardLayout>
  )
}
