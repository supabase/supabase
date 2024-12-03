import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Filter, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ProtectedSchemaModal } from 'components/interfaces/Database/ProtectedSchemaWarning'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import InfiniteList from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
  InnerSideBarShimmeringLoaders,
} from 'ui-patterns/InnerSideMenu'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import EntityListItem from './EntityListItem'

const TableEditorMenu = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))
  const [sort, setSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { project } = useProjectContext()
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
      keepPreviousData: Boolean(searchText),
    }
  )

  const entityTypes = useMemo(
    () => data?.pages.flatMap((page) => page.data.entities),
    [data?.pages]
  )

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const canCreateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const [protectedSchemas] = partition(
    (schemas ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    (schema) => PROTECTED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  useEffect(() => {
    if (selectedTable?.schema) {
      setSelectedSchema(selectedTable.schema)
    }
  }, [selectedTable?.schema])

  return (
    <>
      <div
        className="pt-5 flex flex-col flex-grow gap-5 h-full"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        <div className="flex flex-col gap-y-1.5">
          <SchemaSelector
            className="mx-4"
            selectedSchemaName={selectedSchema}
            onSelectSchema={(name: string) => {
              setSearchText('')
              setSelectedSchema(name)
            }}
            onSelectCreateSchema={() => snap.onAddSchema()}
          />

          <div className="grid gap-3 mx-4">
            {!isLocked ? (
              <ButtonTooltip
                block
                title="Create a new table"
                name="New table"
                disabled={!canCreateTables}
                size="tiny"
                icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
                type="default"
                className="justify-start"
                onClick={snap.onAddTable}
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
              <Alert_Shadcn_>
                <AlertTitle_Shadcn_ className="text-sm">
                  Viewing protected schema
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="text-xs">
                  <p className="mb-2">
                    This schema is managed by Supabase and is read-only through the table editor
                  </p>
                  <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
                    Learn more
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </div>
        </div>
        <div className="flex flex-auto flex-col gap-2 pb-4 px-2">
          <InnerSideBarFilters>
            <InnerSideBarFilterSearchInput
              autoFocus
              name="search-tables"
              aria-labelledby="Search tables"
              onChange={(e) => {
                setSearchText(e.target.value)
              }}
              value={searchText}
              placeholder="Search tables..."
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
            <Popover_Shadcn_>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  type={visibleTypes.length !== 5 ? 'default' : 'dashed'}
                  className="h-[28px] px-1.5"
                  icon={<Filter />}
                />
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center">
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
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </InnerSideBarFilters>

          {isLoading && <InnerSideBarShimmeringLoaders />}

          {isError && (
            <AlertError error={(error ?? null) as any} subject="Failed to retrieve tables" />
          )}

          {isSuccess && (
            <>
              {searchText.length === 0 && (entityTypes?.length ?? 0) <= 0 && (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No entities available"
                  description="This schema has no entities available yet"
                />
              )}
              {searchText.length > 0 && (entityTypes?.length ?? 0) <= 0 && (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No results found"
                  description={`Your search for "${searchText}" did not return any results`}
                />
              )}
              {(entityTypes?.length ?? 0) > 0 && (
                <div className="flex flex-1" data-testid="tables-list">
                  <InfiniteList
                    items={entityTypes}
                    ItemComponent={EntityListItem}
                    itemProps={{
                      projectRef: project?.ref!,
                      id: Number(id),
                      isLocked,
                    }}
                    getItemSize={() => 28}
                    hasNextPage={hasNextPage}
                    isLoadingNextPage={isFetchingNextPage}
                    onLoadNextPage={() => fetchNextPage()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default TableEditorMenu
