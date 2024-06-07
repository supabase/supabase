import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { ProtectedSchemaModal } from 'components/interfaces/Database/ProtectedSchemaWarning'
import AlertError from 'components/ui/AlertError'
import InfiniteList from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useCheckPermissions, useLocalStorage } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
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
  const router = useRouter()
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()

  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
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
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: snap.selectedSchemaName,
      search: searchText || undefined,
      sort,
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

  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const canCreateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const refreshTables = async () => {
    await refetch()
  }

  refreshTables
  const [protectedSchemas] = partition(
    (schemas ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    (schema) => EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <>
      <div
        className="pt-5 flex flex-col flex-grow gap-5 h-full"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        <div className="flex flex-col gap-y-1.5">
          <SchemaSelector
            className="mx-4"
            selectedSchemaName={snap.selectedSchemaName}
            onSelectSchema={(name: string) => {
              setSearchText('')
              snap.setSelectedSchemaName(name)
              router.push(`/project/${project?.ref}/editor`)
            }}
            onSelectCreateSchema={() => snap.onAddSchema()}
          />

          <div className="grid gap-3 mx-4">
            {!isLocked ? (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger className="w-full" asChild>
                  <Button
                    title="Create a new table"
                    name="New table"
                    block
                    disabled={!canCreateTables}
                    size="tiny"
                    icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
                    type="default"
                    className="justify-start"
                    onClick={snap.onAddTable}
                  >
                    New table
                  </Button>
                </Tooltip.Trigger>
                {!canCreateTables && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          You need additional permissions to create tables
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
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
              name="search-tables"
              aria-labelledby="Search tables"
              onChange={(e) => {
                setSearchText(e.target.value.trim())
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
