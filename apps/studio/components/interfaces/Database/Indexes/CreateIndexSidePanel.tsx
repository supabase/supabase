import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { databaseKeys } from 'data/database/keys'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  SidePanel,
  cn,
} from 'ui'
import { MultiSelectOption } from 'ui-patterns/MultiSelectDeprecated'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { INDEX_TYPES } from './Indexes.constants'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import { Admonition } from 'ui-patterns'
import { DocsButton } from 'components/ui/DocsButton'

interface CreateIndexSidePanelProps {
  visible: boolean
  onClose: () => void
}

const CreateIndexSidePanel = ({ visible, onClose }: CreateIndexSidePanelProps) => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const isOrioleDb = useIsOrioleDb()

  const [selectedSchema, setSelectedSchema] = useState('public')
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(undefined)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedIndexType, setSelectedIndexType] = useState<string>(INDEX_TYPES[0].value)
  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false)
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: entities, isLoading: isLoadingEntities } = useEntityTypesQuery({
    schemas: [selectedSchema],
    sort: 'alphabetical',
    search: searchTerm,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
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
      await queryClient.invalidateQueries(databaseKeys.indexes(project?.ref, selectedSchema))
      onClose()
      toast.success(`Successfully created index`)
    },
    onError: (error) => {
      toast.error(`Failed to create index: ${error.message}`)
    },
  })

  const entityTypes = useMemo(
    () => entities?.pages.flatMap((page) => page.data.entities) || [],
    [entities?.pages]
  )

  function handleSearchChange(value: string) {
    setSearchTerm(value)
  }

  const columns = tableColumns?.[0]?.columns ?? []
  const columnOptions: MultiSelectOption[] = columns
    .filter((column): column is NonNullable<typeof column> => column !== null)
    .map((column) => ({
      id: column.attname,
      value: column.attname,
      name: column.attname,
      disabled: false,
    }))

  const generatedSQL = `
CREATE INDEX ON "${selectedSchema}"."${selectedEntity}" USING ${selectedIndexType} (${selectedColumns
    .map((column) => `"${column}"`)
    .join(', ')});
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
      setSelectedEntity('')
      setSelectedColumns([])
      setSelectedIndexType(INDEX_TYPES[0].value)
    }
  }, [visible])

  useEffect(() => {
    setSelectedEntity('')
    setSelectedColumns([])
    setSelectedIndexType(INDEX_TYPES[0].value)
  }, [selectedSchema])

  useEffect(() => {
    setSelectedColumns([])
    setSelectedIndexType(INDEX_TYPES[0].value)
  }, [selectedEntity])

  const isSelectEntityDisabled = entityTypes.length === 0

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
          <FormItemLayout label="Select a schema" name="select-schema" isReactForm={false}>
            <Popover_Shadcn_
              modal={false}
              open={schemaDropdownOpen}
              onOpenChange={setSchemaDropdownOpen}
            >
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  size={'medium'}
                  className={`w-full [&>span]:w-full text-left`}
                  iconRight={
                    <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
                  }
                >
                  {selectedSchema !== undefined && selectedSchema !== ''
                    ? selectedSchema
                    : 'Choose a schema'}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0"
                side="bottom"
                align="start"
                sameWidthAsTrigger
              >
                <Command_Shadcn_>
                  <CommandInput_Shadcn_
                    placeholder="Find table..."
                    value={searchTerm}
                    onValueChange={handleSearchChange}
                  />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                        {(schemas ?? []).map((schema) => (
                          <CommandItem_Shadcn_
                            key={schema.name}
                            className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                            onSelect={() => {
                              setSelectedSchema(schema.name)
                              setSchemaDropdownOpen(false)
                            }}
                            onClick={() => {
                              setSelectedSchema(schema.name)
                              setSchemaDropdownOpen(false)
                            }}
                          >
                            <span>{schema.name}</span>
                            {selectedEntity === schema.name && (
                              <Check className="text-brand" strokeWidth={2} size={16} />
                            )}
                          </CommandItem_Shadcn_>
                        ))}
                      </ScrollArea>
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </FormItemLayout>

          <FormItemLayout
            label="Select a table"
            name="select-table"
            description={
              isSelectEntityDisabled &&
              !isLoadingEntities &&
              'Create a table in this schema via the Table or SQL editor first'
            }
            isReactForm={false}
          >
            <Popover_Shadcn_
              modal={false}
              open={tableDropdownOpen}
              onOpenChange={setTableDropdownOpen}
            >
              <PopoverTrigger_Shadcn_
                asChild
                disabled={isSelectEntityDisabled || isLoadingEntities}
              >
                <Button
                  type="default"
                  size="medium"
                  className={cn(
                    'w-full [&>span]:w-full text-left',
                    selectedEntity === '' && 'text-foreground-lighter'
                  )}
                  iconRight={
                    <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
                  }
                >
                  {selectedEntity !== undefined && selectedEntity !== ''
                    ? selectedEntity
                    : isSelectEntityDisabled
                      ? 'No tables available in schema'
                      : 'Choose a table'}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0"
                side="bottom"
                align="start"
                sameWidthAsTrigger
              >
                {/* [Terry] shouldFilter context:
                https://github.com/pacocoursey/cmdk/issues/267#issuecomment-2252717107 */}
                <Command_Shadcn_ shouldFilter={false}>
                  <CommandInput_Shadcn_
                    placeholder="Find table..."
                    value={searchTerm}
                    onValueChange={handleSearchChange}
                  />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>
                      {isLoadingEntities ? (
                        <div className="flex items-center gap-2 text-center justify-center">
                          <Loader2 size={12} className="animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        'No tables found'
                      )}
                    </CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      <ScrollArea className={(entityTypes || []).length > 7 ? 'h-[210px]' : ''}>
                        {(entityTypes ?? []).map((entity) => (
                          <CommandItem_Shadcn_
                            key={entity.name}
                            className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                            onSelect={() => {
                              setSelectedEntity(entity.name)
                              setTableDropdownOpen(false)
                            }}
                            onClick={() => {
                              setSelectedEntity(entity.name)
                              setTableDropdownOpen(false)
                            }}
                          >
                            <span>{entity.name}</span>
                            {selectedEntity === entity.name && (
                              <Check className="text-brand" strokeWidth={2} size={16} />
                            )}
                          </CommandItem_Shadcn_>
                        ))}
                      </ScrollArea>
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </FormItemLayout>

          {selectedEntity && (
            <FormItemLayout label="Select up to 32 columns" isReactForm={false}>
              {isLoadingTableColumns && <ShimmeringLoader className="py-4" />}
              {isSuccessTableColumns && (
                <MultiSelectV2
                  options={columnOptions}
                  placeholder="Choose which columns to create an index on"
                  searchPlaceholder="Search for a column"
                  value={selectedColumns}
                  onChange={setSelectedColumns}
                />
              )}
            </FormItemLayout>
          )}
        </SidePanel.Content>

        {selectedColumns.length > 0 && (
          <>
            <SidePanel.Separator />
            <SidePanel.Content className="space-y-6">
              <FormItemLayout
                label="Select an index type"
                name="selected-index-type"
                isReactForm={false}
              >
                <Select_Shadcn_
                  disabled={isOrioleDb}
                  value={selectedIndexType}
                  onValueChange={setSelectedIndexType}
                  name="selected-index-type"
                >
                  <SelectTrigger_Shadcn_ size={'small'}>
                    <SelectValue_Shadcn_ className="font-mono">
                      {selectedIndexType}
                    </SelectValue_Shadcn_>
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {INDEX_TYPES.map((index, i) => (
                      <Fragment key={index.name}>
                        <SelectItem_Shadcn_ value={index.value}>
                          <div className="flex flex-col gap-0.5">
                            <span>{index.name}</span>
                            {index.description.split('\n').map((x, idx) => (
                              <span
                                className="text-foreground-lighter group-focus:text-foreground-light group-data-[state=checked]:text-foreground-light"
                                key={`${index.value}-description-${idx}`}
                              >
                                {x}
                              </span>
                            ))}
                          </div>
                        </SelectItem_Shadcn_>
                        {i < INDEX_TYPES.length - 1 && <SelectSeparator_Shadcn_ />}
                      </Fragment>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormItemLayout>
              {isOrioleDb && (
                <Admonition
                  type="default"
                  className="!mt-2"
                  title="OrioleDB currently only supports the B-tree index type"
                  description="More index types may be supported when OrioleDB is no longer in preview"
                >
                  {/* [Joshen Oriole] Hook up proper docs URL */}
                  <DocsButton className="mt-2" abbrev={false} href="https://supabase.com/docs" />
                </Admonition>
              )}
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
