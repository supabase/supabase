import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { getTabsStore, addTab } from 'components/layouts/tabs/explorer-tabs.store'
import { Table2 } from 'lucide-react'
import { useParams } from 'common/hooks'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import {
  ProjectContextFromParamsProvider,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const [_, setTabsState] = useAtom(getTabsStore('explorer'))

  const { project } = useProjectContext()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  useEffect(() => {
    if (selectedTable) {
      const tableTab = {
        id: `table-${selectedTable.schema}-${selectedTable.name}`,
        type: 'table' as const,
        label: selectedTable.name,
        icon: <Table2 size={15} />,
        metadata: {
          schema: selectedTable.schema,
          name: selectedTable.name,
          tableId: id,
        },
      }

      addTab(setTabsState, tableTab)
    }
  }, [selectedTable, id])

  return (
    <>
      <TableGridEditor
        isLoadingSelectedTable={isLoading}
        selectedTable={selectedTable}
        theme={resolvedTheme?.includes('dark') ? 'dark' : 'light'}
      />
      <DeleteConfirmationDialogs
        selectedTable={selectedTable}
        onAfterDeleteTable={(tables) => {
          // For simplicity for now, we just open the first table within the same schema
          if (tables.length > 0) {
            router.push(`/project/${projectRef}/editor/${tables[0].id}`)
          } else {
            router.push(`/project/${projectRef}/editor`)
          }
        }}
      />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
