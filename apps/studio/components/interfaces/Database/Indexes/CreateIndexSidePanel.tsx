import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Form,
  FormControl,
  FormField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { INDEX_TYPES } from './Indexes.constants'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDatabaseIndexCreateMutation } from '@/data/database-indexes/index-create-mutation'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useTableColumnsQuery } from '@/data/database/table-columns-query'
import { useEntityTypesQuery } from '@/data/entity-types/entity-types-infinite-query'
import { useIsOrioleDb, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

interface CreateIndexSidePanelProps {
  visible: boolean
  onClose: () => void
}

const formSchema = z.object({
  schema: z.string().min(1, 'Please provide a name for your schema'),
  table: z.string().min(1, 'Please provide a name for your table'),
  columns: z
    .array(z.string())
    .min(1, 'Please select at least one column')
    .max(32, 'You can select up to 32 columns'),
  type: z.string().min(1, 'Please select an index type'),
})

type FormSchema = z.infer<typeof formSchema>

export const CreateIndexSidePanel = ({ visible, onClose }: CreateIndexSidePanelProps) => {
  const { data: project } = useSelectedProjectQuery()
  const isOrioleDb = useIsOrioleDb()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schema: 'public',
      table: '',
      columns: [],
      type: INDEX_TYPES[0].value,
    },
  })

  const formId = 'schema-form'

  const selectedSchema = useWatch({ name: 'schema', control: form.control })
  const selectedEntity = useWatch({ name: 'table', control: form.control })
  const selectedColumns = useWatch({ name: 'columns', control: form.control }) ?? []
  const selectedIndexType = useWatch({ name: 'type', control: form.control })

  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false)
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [schemaSearchTerm, setSchemaSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: entities, isPending: isLoadingEntities } = useEntityTypesQuery({
    schemas: [selectedSchema],
    sort: 'alphabetical',
    search: searchTerm,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: tableColumns,
    isPending: isLoadingTableColumns,
    isSuccess: isSuccessTableColumns,
  } = useTableColumnsQuery({
    schema: selectedSchema,
    table: selectedEntity,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: createIndex, isPending: isExecuting } = useDatabaseIndexCreateMutation({
    onSuccess: () => {
      onClose()
      toast.success(`Successfully created index`)
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
  const columnOptions = columns
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

  const { reset } = form
  useEffect(() => {
    if (visible) {
      reset()
      setSchemaSearchTerm('')
      setSearchTerm('')
    }
  }, [visible, reset])

  useEffect(() => {
    if (!schemaDropdownOpen) setSchemaSearchTerm('')
  }, [schemaDropdownOpen])

  const isSelectEntityDisabled = entityTypes.length === 0 && searchTerm.trim().length === 0

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!project) return console.error('Project is required')
    if (!selectedEntity) return console.error('Entity is required')

    createIndex({
      projectRef: project.ref,
      connectionString: project.connectionString,
      payload: {
        schema: values.schema,
        entity: values.table,
        type: values.type,
        columns: values.columns,
      },
    })
  }

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent size="lg" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Create new index</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="overflow-auto grow px-0"
          >
            <SheetSection>
              <FormField
                control={form.control}
                name="schema"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Select a schema" id="schema">
                    <FormControl className="col-span-6">
                      <Popover
                        modal={false}
                        open={schemaDropdownOpen}
                        onOpenChange={setSchemaDropdownOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            id="schema"
                            variant="default"
                            size={'medium'}
                            className={`w-full [&>span]:w-full text-left`}
                            iconRight={
                              <ChevronsUpDown
                                className="text-foreground-muted"
                                strokeWidth={2}
                                size={14}
                              />
                            }
                          >
                            {field.value || 'Choose a schema'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-0"
                          side="bottom"
                          align="start"
                          sameWidthAsTrigger
                        >
                          <Command>
                            <CommandInput
                              placeholder="Find schema..."
                              value={schemaSearchTerm}
                              onValueChange={setSchemaSearchTerm}
                            />
                            <CommandList
                              className={cn(
                                (schemas ?? []).length > 7 && 'max-h-[210px]! overflow-y-auto'
                              )}
                              onWheel={(event) => event.stopPropagation()}
                            >
                              <CommandEmpty>No schemas found</CommandEmpty>
                              <CommandGroup>
                                {(schemas ?? []).map((schema) => (
                                  <CommandItem
                                    key={schema.name}
                                    value={schema.name}
                                    className="cursor-pointer flex items-center space-x-2 w-full"
                                    onSelect={() => {
                                      field.onChange(schema.name)
                                      form.setValue('table', '')
                                      form.setValue('columns', [])
                                      form.setValue('type', INDEX_TYPES[0].value)
                                      setSearchTerm('')
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'text-brand',
                                        schema.name === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                      strokeWidth={2}
                                      size={16}
                                    />
                                    <span>{schema.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator className="w-full" />

            <SheetSection>
              <FormField
                control={form.control}
                name="table"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Select a table"
                    id="table"
                    description={
                      isSelectEntityDisabled &&
                      !isLoadingEntities &&
                      'Create a table in this schema via the Table or SQL editor first'
                    }
                  >
                    <FormControl className="col-span-6">
                      <Popover
                        modal={false}
                        open={tableDropdownOpen}
                        onOpenChange={setTableDropdownOpen}
                      >
                        <PopoverTrigger
                          asChild
                          disabled={isSelectEntityDisabled || isLoadingEntities}
                        >
                          <Button
                            id="table"
                            variant="default"
                            size="medium"
                            className={cn(
                              'w-full [&>span]:w-full text-left',
                              selectedEntity === '' && 'text-foreground-lighter'
                            )}
                            iconRight={
                              <ChevronsUpDown
                                className="text-foreground-muted"
                                strokeWidth={2}
                                size={14}
                              />
                            }
                          >
                            {field.value
                              ? field.value
                              : isSelectEntityDisabled
                                ? 'No tables available in schema'
                                : 'Choose a table'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-0"
                          side="bottom"
                          align="start"
                          sameWidthAsTrigger
                        >
                          {/* [Terry] shouldFilter context:
                          https://github.com/pacocoursey/cmdk/issues/267#issuecomment-2252717107 */}
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Find table..."
                              value={searchTerm}
                              onValueChange={handleSearchChange}
                            />
                            <CommandList
                              className={cn(
                                entityTypes.length > 7 && 'max-h-[210px]! overflow-y-auto'
                              )}
                              onWheel={(event) => event.stopPropagation()}
                            >
                              <CommandEmpty>
                                {isLoadingEntities ? (
                                  <div className="flex items-center gap-2 text-center justify-center">
                                    <Loader2 size={12} className="animate-spin" />
                                    Loading...
                                  </div>
                                ) : (
                                  'No tables found'
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {entityTypes.map((entity) => (
                                  <CommandItem
                                    key={entity.name}
                                    className="cursor-pointer flex items-center space-x-2 w-full"
                                    onSelect={() => {
                                      field.onChange(entity.name)
                                      setTableDropdownOpen(false)
                                      form.setValue('columns', [])
                                      form.setValue('type', INDEX_TYPES[0].value)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'text-brand',
                                        entity.name === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                      strokeWidth={2}
                                      size={16}
                                    />
                                    <span>{entity.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator className="w-full" />

            {selectedEntity && (
              <SheetSection>
                <FormField
                  control={form.control}
                  name="columns"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Select up to 32 columns"
                      id="columns"
                    >
                      {isLoadingTableColumns && <ShimmeringLoader className="py-4" />}
                      {isSuccessTableColumns && (
                        <div className="col-span-6">
                          <MultiSelector
                            onValuesChange={field.onChange}
                            values={field.value}
                            size="small"
                            className="w-full"
                          >
                            <MultiSelectorTrigger
                              id="columns"
                              mode="inline-combobox"
                              label={
                                field.value.length === 0
                                  ? 'Choose which columns to create an index on'
                                  : 'Search for a column'
                              }
                              deletableBadge
                              badgeLimit="wrap"
                              showIcon={false}
                              className="w-full"
                            />
                            <MultiSelectorContent>
                              <MultiSelectorList>
                                {columnOptions.map((option) => (
                                  <MultiSelectorItem
                                    key={option.id}
                                    value={option.value}
                                    disabled={option.disabled}
                                  >
                                    {option.name}
                                  </MultiSelectorItem>
                                ))}
                              </MultiSelectorList>
                            </MultiSelectorContent>
                          </MultiSelector>
                        </div>
                      )}
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
            )}

            <Separator className="w-full" />

            {selectedColumns.length > 0 && (
              <>
                <SheetSection>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <>
                        <FormItemLayout layout="horizontal" label="Select an index type">
                          <FormControl className="col-span-6">
                            <Select
                              disabled={isOrioleDb}
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue className="font-mono">{selectedIndexType}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {INDEX_TYPES.map((index, i) => (
                                  <Fragment key={index.name}>
                                    <SelectItem value={index.value}>
                                      <div className="flex flex-col gap-0.5">
                                        <span>{index.name}</span>
                                        {index.description.split('\n').map((x, idx) => (
                                          <span
                                            className="text-foreground-lighter group-focus:text-foreground-light group-data-checked:text-foreground-light"
                                            key={`${index.value}-description-${idx}`}
                                          >
                                            {x}
                                          </span>
                                        ))}
                                      </div>
                                    </SelectItem>
                                    {i < INDEX_TYPES.length - 1 && <SelectSeparator />}
                                  </Fragment>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItemLayout>

                        {isOrioleDb && (
                          <Admonition
                            type="default"
                            className="mt-2!"
                            title="OrioleDB currently only supports the B-tree index type"
                            description="More index types may be supported when OrioleDB is no longer in preview"
                          >
                            {/* [Joshen Oriole] Hook up proper docs URL */}
                            <DocsButton className="mt-2" abbrev={false} href={`${DOCS_URL}`} />
                          </Admonition>
                        )}
                      </>
                    )}
                  />
                </SheetSection>

                <Separator className="w-full" />
                <SheetSection>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Preview of SQL statement</p>
                    <Button asChild variant="default">
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
                </SheetSection>
                <div className="h-[200px] mt-2!">
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
          </form>
        </Form>
        <SheetFooter>
          <Button
            variant="default"
            disabled={isExecuting}
            onClick={() => {
              form.reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            form={formId}
            type="submit"
            disabled={isExecuting}
            loading={isExecuting}
          >
            Create index
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
