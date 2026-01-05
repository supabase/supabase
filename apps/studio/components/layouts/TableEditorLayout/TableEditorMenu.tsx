import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Filter, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { ExportDialog } from 'components/grid/components/header/ExportDialog'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { SupaTable } from 'components/grid/types'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import EditorMenuListSkeleton from 'components/layouts/TableEditorLayout/EditorMenuListSkeleton'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InfiniteListDefault, LoaderForIconMenuItems } from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useTableApiAccessQuery } from 'data/privileges/table-api-access-query'
import { getTableEditor, useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent,
  PopoverTrigger,
  Popover,
} from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
} from 'ui-patterns/InnerSideMenu'
import { useTableEditorTabsCleanUp } from '../Tabs/Tabs.utils'
import { EntityListItem } from './EntityListItem'
import { TableMenuEmptyState } from './TableMenuEmptyState'

export const TableEditorMenu = () => {
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const isMobile = useBreakpoint()

  const [searchText, setSearchText] = useState<string>('')
  const [tableToExport, setTableToExport] = useState<SupaTable>()
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))
  const [sort, setSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { data: project } = useSelectedProjectQuery()
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schemas: [selectedSchema],
      search: searchText.trim() || undefined,
      sort,
      filterTypes: visibleTypes,
    },
    {
      placeholderData: Boolean(searchText) ? keepPreviousData : undefined,
    }
  )

  const entityTypes = useMemo(
    () => data?.pages.flatMap((page) => page.data.entities),
    [data?.pages]
  )
  const entityNames = useMemo(() => entityTypes?.map((entity) => entity.name) ?? [], [entityTypes])

  const { data: apiAccessByTableName } = useTableApiAccessQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString ?? undefined,
      schemaName: selectedSchema,
      tableNames: entityNames,
    },
    { enabled: Boolean(selectedSchema && entityNames.length > 0) }
  )

  const { can: canCreateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  if (selectedTable?.schema && !selectedSchema) {
    setSelectedSchema(selectedTable.schema)
  }

  const tableEditorTabsCleanUp = useTableEditorTabsCleanUp()

  const onSelectExportCLI = useCallback(
    async (id: number) => {
      const table = await getTableEditor({
        id: id,
        projectRef,
        connectionString: project?.connectionString,
      })
      const supaTable = table && parseSupaTable(table)
      setTableToExport(supaTable)
    },
    [project?.connectionString, projectRef]
  )

  const getItemKey = useCallback(
    (index: number) => {
      const item = entityTypes?.[index]
      return item?.id ? String(item.id) : `table-editor-entity-${index}`
    },
    [entityTypes]
  )

  const entityProps = useMemo(
    () => ({
      projectRef: project?.ref!,
      id: Number(id),
      isLocked: isSchemaLocked,
      onExportCLI: () => onSelectExportCLI(Number(id)),
      apiAccessMap: apiAccessByTableName,
    }),
    [project?.ref, id, isSchemaLocked, onSelectExportCLI, apiAccessByTableName]
  )

  useEffect(() => {
    // Clean up tabs + recent items for any tables that might have been removed outside of the dashboard session
    if (entityTypes && !searchText) {
      tableEditorTabsCleanUp({ schemas: [selectedSchema], entities: entityTypes })
    }
  }, [entityTypes, searchText, selectedSchema, tableEditorTabsCleanUp])

  return (
    <>
      <div className="flex flex-col flex-grow gap-5 pt-5 h-full">
        <div className="flex flex-col gap-y-1.5">
          <SchemaSelector
            className="mx-4"
            selectedSchemaName={selectedSchema}
            onSelectSchema={(name: string) => {
              setSearchText('')
              setSelectedSchema(name)
            }}
            onSelectCreateSchema={() => snap.onAddSchema()}
            portal={!isMobile}
          />

          <div className="grid gap-3 mx-4">
            {!isSchemaLocked ? (
              <ButtonTooltip
                block
                title="Create a new table"
                name="New table"
                disabled={!canCreateTables}
                size="tiny"
                icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
                type="default"
                className="justify-start"
                onClick={() => snap.onAddTable()}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canCreateTables
                      ? 'You need additional permissions to create tables'
                      : undefined,
                  },
                }}
              >
                New table
              </ButtonTooltip>
            ) : (
              <ProtectedSchemaWarning size="sm" schema={selectedSchema} entity="table" />
            )}
          </div>
        </div>
        <div className="grow min-h-0 flex flex-col gap-2 pb-4">
          <InnerSideBarFilters className="mx-2">
            <InnerSideBarFilterSearchInput
              autoFocus={!isMobile}
              name="search-tables"
              value={searchText}
              placeholder="Search tables..."
              aria-labelledby="Search tables"
              onChange={(e) => setSearchText(e.target.value)}
            >
              <InnerSideBarFilterSortDropdown
                value={sort}
                onValueChange={(value: any) => setSort(value)}
              >
                <InnerSideBarFilterSortDropdownItem
                  key="alphabetical"
                  value="alphabetical"
                  className="flex gap-2"
                >
                  Alphabetical
                </InnerSideBarFilterSortDropdownItem>
                <InnerSideBarFilterSortDropdownItem
                  key="grouped-alphabetical"
                  value="grouped-alphabetical"
                >
                  Entity Type
                </InnerSideBarFilterSortDropdownItem>
              </InnerSideBarFilterSortDropdown>
            </InnerSideBarFilterSearchInput>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type={visibleTypes.length !== 5 ? 'default' : 'dashed'}
                  className="h-[32px] md:h-[28px] px-1.5"
                  icon={<Filter />}
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-56" side="bottom" align="center">
                <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
                  <p className="text-xs">Show entity types</p>
                  <div className="flex flex-col">
                    {Object.entries(ENTITY_TYPE).map(([key, value]) => (
                      <div key={key} className="group flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-x-2">
                          <Checkbox_Shadcn_
                            id={key}
                            name={key}
                            checked={visibleTypes.includes(value)}
                            onCheckedChange={() => {
                              if (visibleTypes.includes(value)) {
                                setVisibleTypes(visibleTypes.filter((y) => y !== value))
                              } else {
                                setVisibleTypes(visibleTypes.concat([value]))
                              }
                            }}
                          />
                          <Label_Shadcn_ htmlFor={key} className="capitalize text-xs">
                            {key.toLowerCase().replace('_', ' ')}
                          </Label_Shadcn_>
                        </div>
                        <Button
                          size="tiny"
                          type="default"
                          onClick={() => setVisibleTypes([value])}
                          className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                        >
                          Select only
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </InnerSideBarFilters>

          {isLoading && <EditorMenuListSkeleton />}

          {isError && (
            <div className="mx-4">
              <AlertError error={(error ?? null) as any} subject="Failed to retrieve tables" />
            </div>
          )}

          {isSuccess && (
            <>
              {searchText.length === 0 && (entityTypes?.length ?? 0) <= 0 && (
                <TableMenuEmptyState />
              )}
              {searchText.length > 0 && (entityTypes?.length ?? 0) <= 0 && (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No results found"
                  description={`Your search for "${searchText}" did not return any results`}
                />
              )}
              {(entityTypes?.length ?? 0) > 0 && (
                <div className="flex flex-1 min-h-0 w-full" data-testid="tables-list">
                  <InfiniteListDefault
                    className="h-full w-full"
                    items={entityTypes!}
                    ItemComponent={EntityListItem}
                    LoaderComponent={LoaderForIconMenuItems}
                    itemProps={entityProps}
                    getItemKey={getItemKey}
                    getItemSize={(index) =>
                      index !== 0 && index === entityTypes!.length ? 85 : 28
                    }
                    hasNextPage={hasNextPage}
                    isLoadingNextPage={isFetchingNextPage}
                    onLoadNextPage={fetchNextPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ExportDialog
        ignoreRoleImpersonation
        table={tableToExport}
        open={!!tableToExport}
        onOpenChange={(open) => {
          if (!open) setTableToExport(undefined)
        }}
      />
    </>
  )
}
