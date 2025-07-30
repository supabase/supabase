import Editor from '@monaco-editor/react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Code, List, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { ColumnList } from 'components/interfaces/Database/Tables/ColumnList'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { formatSql } from 'lib/formatSql'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import type { NextPageWithLayout } from 'types'
import { Skeleton, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

const DatabaseTables: NextPageWithLayout = () => {
  const snap = useTableEditorStateSnapshot()
  const { resolvedTheme } = useTheme()

  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined
  const [view, setView] = useState<'list' | 'definition'>('list')

  const { project } = useProjectContext()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const isTableEntity = isTableLike(selectedTable)

  const { data: definition } = useTableDefinitionQuery(
    {
      id: selectedTable?.id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isTableEntity,
    }
  )

  const formattedDefinition = useMemo(
    () => (definition ? formatSql(definition) : undefined),
    [definition]
  )

  const canUpdateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  return (
    <PageLayout
      title={selectedTable?.name ?? <Skeleton className="w-48 h-6" />}
      breadcrumbs={[
        {
          label: 'Tables',
          href: `/project/${ref}/database/tables`,
        },
      ]}
      primaryActions={
        isTableEntity && (
          <ButtonTooltip
            icon={<Plus />}
            disabled={!canUpdateColumns}
            onClick={() => snap.onAddColumn()}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateColumns
                  ? 'You need additional permissions to create columns'
                  : undefined,
              },
            }}
          >
            New column
          </ButtonTooltip>
        )
      }
      secondaryActions={
        isTableEntity && (
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => setView(value as 'list' | 'definition')}
          >
            <ToggleGroupItem className="h-7 w-7 p-0" value="list" aria-label="List view">
              <Tooltip>
                <TooltipTrigger>
                  <List size={14} />
                </TooltipTrigger>
                <TooltipContent side="bottom">View columns</TooltipContent>
              </Tooltip>
            </ToggleGroupItem>
            <ToggleGroupItem
              className="h-7 w-7 p-0"
              value="definition"
              aria-label="Definition view"
            >
              <Tooltip>
                <TooltipTrigger>
                  <Code size={14} />
                </TooltipTrigger>
                <TooltipContent side="bottom">View table definition</TooltipContent>
              </Tooltip>
            </ToggleGroupItem>
          </ToggleGroup>
        )
      }
    >
      <ScaffoldSection isFullWidth>
        <ScaffoldContainer>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
            </div>
          ) : (
            project?.ref !== undefined &&
            selectedTable !== undefined && (
              <TableEditorTableStateContextProvider
                key={`table-editor-table-${selectedTable.id}`}
                projectRef={project.ref}
                table={selectedTable}
              >
                {view === 'list' ? (
                  <ColumnList
                    showControls={false}
                    onAddColumn={snap.onAddColumn}
                    onEditColumn={snap.onEditColumn}
                    onDeleteColumn={snap.onDeleteColumn}
                  />
                ) : (
                  <div className="h-96 w-full border rounded-lg overflow-hidden">
                    <Editor
                      className="monaco-editor"
                      theme={resolvedTheme?.includes('dark') ? 'vs-dark' : 'vs'}
                      defaultLanguage="pgsql"
                      value={formattedDefinition}
                      path={''}
                      options={{
                        domReadOnly: true,
                        readOnly: true,
                        padding: { top: 16 },
                        tabSize: 2,
                        fontSize: 13,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                )}

                {isTableEntity && (
                  <>
                    <DeleteConfirmationDialogs selectedTable={selectedTable} />
                    <SidePanelEditor includeColumns selectedTable={selectedTable} />
                  </>
                )}
              </TableEditorTableStateContextProvider>
            )
          )}
        </ScaffoldContainer>
      </ScaffoldSection>
    </PageLayout>
  )
}

DatabaseTables.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTables
