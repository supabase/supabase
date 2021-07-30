import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement } from 'react'
import { Button, IconPlus } from '@supabase/ui'

export default function EditorLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const { tables, isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  const tableNames = tables.map((table) => table.name)

  const buildSidebar = (tableNames: string[]) => {
    return [
      {
        label: 'All tables',
        links: tableNames.map((name) => ({ label: name, href: `/editor/tables/${name}` })),
      },
    ]
  }

  const buildSidebarAction = () => {
    return (
      <Button icon={<IconPlus />} shadow={true} block type="text">
        New table
      </Button>
    )
  }

  return (
    <DashboardLayout
      title={title || 'Table Editor'}
      sidebar={{
        title: 'Tables',
        categories: buildSidebar(tableNames),
        searchable: true,
        action: buildSidebarAction(),
      }}
    >
      {children}
    </DashboardLayout>
  )
}
