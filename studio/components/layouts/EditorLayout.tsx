import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchTableData } from '../../lib/api'
import { ReactElement, useState } from 'react'
import NewTableForm from '../../components/forms/NewTable'

export default function EditorLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const { tables, isLoading, error } = fetchTableData()
  const [sidePanelVisible, setSidePanelVisible] = useState(false)
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

  const buildSidebarButton = () => {
    return {
      label: 'New table',
      action: (_e: any) => setSidePanelVisible(true),
    }
  }

  return (
    <DashboardLayout
      title={title || 'Table Editor'}
      sidebar={{
        title: 'Tables',
        categories: buildSidebar(tableNames),
        searchable: true,
        button: buildSidebarButton(),
      }}
    >
      <>
        {sidePanelVisible && (
          <NewTableForm visible={sidePanelVisible} setVisible={setSidePanelVisible} />
        )}
        {children}
      </>
    </DashboardLayout>
  )
}
