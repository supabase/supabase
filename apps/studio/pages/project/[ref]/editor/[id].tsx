import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'

import { useParams } from 'common/hooks'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import {
  ProjectContextFromParamsProvider,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import {
  getTableLikeFromTableEditor,
  useTableEditorQuery,
} from 'data/table-editor/table-editor-query'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined

  const { project } = useProjectContext()
  const { data, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const selectedTable = getTableLikeFromTableEditor(data)

  return (
    <>
      <TableGridEditor
        isLoadingSelectedTable={isLoading}
        selectedTable={selectedTable}
        entityType={data?.entity}
        encryptedColumns={data?.encrypted_columns ?? undefined}
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
    <TableEditorLayout>{page}</TableEditorLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
