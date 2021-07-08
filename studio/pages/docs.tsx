import DashboardLayout from '../components/layouts/DashboardLayout'
import Loading from '../components/utils/Loading'
import Error from '../components/utils/Error'
import { fetchOpenApiSpec } from '../lib/api'

export default function Home() {
  const { data, isLoading, error } = fetchOpenApiSpec()
  
  if (isLoading) return <Loading />
  if (error) return <Error />
    
  const definitions = data!.definitions || {}
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
    <DashboardLayout
      title="API Docs"
      sidebar={{ title: 'API', categories: buildSidebar(tableNames) }}
    >
        <>
          <h1>API Docs</h1>
        </>
    </DashboardLayout>
  )
}
