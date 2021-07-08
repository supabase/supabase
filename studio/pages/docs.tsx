import DashboardLayout from '../components/layouts/DashboardLayout'
import { fetchOpenApiSpec } from '../lib/api'

export default function Home() {
  const { data, error } = fetchOpenApiSpec()

  if (!data) return <div>loading...</div>

  const { definitions } = data
  const tableNames = Object.keys(definitions)

  const buildSidebar = (tableNames: string[]) => {
    return [
      {
        label: 'Tables',
        links: tableNames.map((name) => ({ label: name, href: `/docs/${name}` })),
      },
    ]
  }

  return (
    <DashboardLayout title="API Docs" menu={{ title: 'API', categories: buildSidebar(tableNames) }}>
      <>
        <h1>API Docs</h1>
      </>
    </DashboardLayout>
  )
}
