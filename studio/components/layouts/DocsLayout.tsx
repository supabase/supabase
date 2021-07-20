import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement } from 'react'

export default function DocsLayout({ title, children }: { title: string; children: ReactElement }) {
  const { data, tables, functions, isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  const tableNames = tables.map((table) => table.name)
  const functionNames = functions.map((table) => table.name)

  const buildSidebar = (tableNames: string[], functionNames: string[]) => {
    return [
      {
        label: 'Tables',
        links: tableNames.map((name) => ({ label: name, href: `/docs/tables/${name}` })),
      },
      {
        label: 'Functions',
        links: functionNames.map((name) => ({ label: name, href: `/docs/functions/${name}` })),
      },
    ]
  }

  return (
    <DashboardLayout
      title={title || 'API Docs'}
      sidebar={{ title: 'API', categories: buildSidebar(tableNames, functionNames) }}
    >
      {children}
    </DashboardLayout>
  )
}
