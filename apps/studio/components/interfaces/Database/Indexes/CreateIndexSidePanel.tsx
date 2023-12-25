import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Listbox, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import CodeEditor from 'components/ui/CodeEditor'
import MultiSelect, { MultiSelectOption } from 'components/ui/MultiSelect'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useIndexesQuery } from 'data/database/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useStore } from 'hooks'
import { INDEX_TYPES } from './Indexes.constants'

interface CreateIndexSidePanelProps {
  visible: boolean
  onClose: () => void
}

const CreateIndexSidePanel = ({ visible, onClose }: CreateIndexSidePanelProps) => {
  const { ui } = useStore()
  const { project } = useProjectContext()
  const [selectedSchema, setSelectedSchema] = useState('public')
  const [selectedEntity, setSelectedEntity] = useState('---')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedIndexType, setSelectedIndexType] = useState<string>(INDEX_TYPES[0].value)

  const { refetch: refetchIndexes } = useIndexesQuery({
    schema: selectedSchema,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: entities } = useEntityTypesQuery(
    {
      schema: selectedSchema,
      sort: 'alphabetical',
      search: undefined,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { keepPreviousData: true }
  )
  const {
    data: tableColumns,
    isLoading: isLoadingTableColumns,
    isSuccess: isSuccessTableColumns,
  } = useTableColumnsQuery({
    schema: selectedSchema,
    table: selectedEntity,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async () => {
      await refetchIndexes()
      onClose()
      ui.setNotification({ category: 'success', message: `Successfully created index` })
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to create index: ${error.message}`,
      })
    },
  })

  const entityTypes = useMemo(
    () => entities?.pages.flatMap((page) => page.data.entities) || [],
    [entities?.pages]
  )
  const columns = tableColumns?.result[0]?.columns ?? []
  const columnOptions: MultiSelectOption[] = columns.map((column) => {
    return { id: column.attname, value: column.attname, name: column.attname, disabled: false }
  })

  const generatedSQL = `
CREATE INDEX ON "${selectedSchema}"."${selectedEntity}" USING ${selectedIndexType} (${selectedColumns.join(
    ', '
  )});
`.trim()

  const onSaveIndex = () => {
    if (!project) return console.error('Project is required')

    execute({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: generatedSQL,
    })
  }

  useEffect(() => {
    if (visible) {
      setSelectedSchema('public')
      setSelectedEntity('---')
      setSelectedColumns([])
      setSelectedIndexType(INDEX_TYPES[0].value)
    }
  }, [visible])

  useEffect(() => {
    setSelectedEntity('---')
    setSelectedColumns([])
    setSelectedIndexType(INDEX_TYPES[0].value)
  }, [selectedSchema])

  useEffect(() => {
    setSelectedColumns([])
    setSelectedIndexType(INDEX_TYPES[0].value)
  }, [selectedEntity])

  return (
    <SidePanel
      size="large"
      header="Create new index"
      visible={visible}
      onCancel={onClose}
      onConfirm={() => onSaveIndex()}
      loading={isExecuting}
      confirmText="Create index"
    >
      <div className="py-6 space-y-6">
        <SidePanel.Content className="space-y-6">
          <Listbox
            size="small"
            label="Select a schema"
            value={selectedSchema}
            onChange={setSelectedSchema}
          >
            {(schemas ?? []).map((schema) => (
              <Listbox.Option key={schema.name} value={schema.name} label={schema.name}>
                {schema.name}
              </Listbox.Option>
            ))}
          </Listbox>

          {entityTypes.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground-light leading-4">Select a table</p>
              <Input
                disabled
                placeholder="No tables available in schema"
                descriptionText="Create a table in this schema via the Table or SQL editor first"
              />
            </div>
          ) : (
            <Listbox
              size="small"
              label="Select a table"
              value={selectedEntity}
              onChange={setSelectedEntity}
            >
              <Listbox.Option key="default-option-table" value="---" label="---">
                ---
              </Listbox.Option>
              {(entityTypes ?? []).map((entity) => (
                <Listbox.Option key={entity.name} value={entity.name} label={entity.name}>
                  {entity.name}
                </Listbox.Option>
              ))}
            </Listbox>
          )}

          {selectedEntity !== '---' && (
            <div>
              <p className="text-sm text-foreground-light mb-2">Select up to 32 columns</p>
              {isLoadingTableColumns && <ShimmeringLoader className="py-4" />}
              {isSuccessTableColumns && (
                <MultiSelect
                  options={columnOptions}
                  placeholder=""
                  searchPlaceholder="Search for a column"
                  value={selectedColumns}
                  onChange={setSelectedColumns}
                />
              )}
            </div>
          )}
        </SidePanel.Content>

        {selectedColumns.length > 0 && (
          <>
            <SidePanel.Separator />
            <SidePanel.Content className="space-y-6">
              <Listbox
                size="small"
                label="Select an index type"
                value={selectedIndexType}
                onChange={setSelectedIndexType}
              >
                {INDEX_TYPES.map((index) => (
                  <Listbox.Option key={index.name} value={index.value} label={index.name}>
                    <p>{index.name}</p>
                    {index.description.split('\n').map((x, idx) => (
                      <p key={`${index.value}-description-${idx}`}>{x}</p>
                    ))}
                  </Listbox.Option>
                ))}
              </Listbox>
            </SidePanel.Content>
            <SidePanel.Separator />
            <SidePanel.Content>
              <div className="flex items-center justify-between">
                <p className="text-sm">Preview of SQL statement</p>
                <Button asChild type="default">
                  <Link
                    href={
                      project !== undefined
                        ? `/project/${project.ref}/sql/new?content=${generatedSQL}`
                        : '/'
                    }
                  >
                    Open in SQL Editor
                  </Link>
                </Button>
              </div>
            </SidePanel.Content>
            <div className="h-[200px] !mt-2">
              <div className="relative h-full">
                <CodeEditor
                  isReadOnly
                  autofocus={false}
                  id={`${selectedSchema}-${selectedEntity}-${selectedColumns.join(
                    ','
                  )}-${selectedIndexType}`}
                  language="pgsql"
                  defaultValue={generatedSQL}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </SidePanel>
  )
}

export default CreateIndexSidePanel
