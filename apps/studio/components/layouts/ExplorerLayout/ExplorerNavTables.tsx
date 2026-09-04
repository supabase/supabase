import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavPanel, rowClassName } from './ExplorerLayout.constants'
import {
  entityQueryId,
  TABLE_ENTITY_TYPES,
  type QueryEntityBinding,
} from '@/components/interfaces/Explorer/entityQuery.utils'
import { useOpenEntityQuery } from '@/components/interfaces/Explorer/hooks'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import {
  InfiniteListDefault,
  LoaderForIconMenuItems,
  type RowComponentBaseProps,
} from '@/components/ui/InfiniteList'
import { SchemaSelector } from '@/components/ui/SchemaSelector'
import { useEntityTypesQuery, type Entity } from '@/data/entity-types/entity-types-infinite-query'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const TABLE_ROW_HEIGHT = 28

type TableListItemProps = RowComponentBaseProps<Entity> & {
  activeQueryId: string | undefined
  onOpen: (entity: QueryEntityBinding) => void
}

const TableListItem = ({ item: table, style, activeQueryId, onOpen }: TableListItemProps) => {
  const entity = { schema: table.schema, name: table.name, type: table.type }
  const isActive = activeQueryId === entityQueryId(entity)

  return (
    <button
      type="button"
      tabIndex={0}
      className={rowClassName(isActive)}
      style={style}
      onClick={() => onOpen(entity)}
    >
      <EntityTypeIcon type={table.type} size={14} isActive={isActive} />
      <span className={cn('truncate text-left', isActive && 'text-foreground')}>{table.name}</span>
    </button>
  )
}

/**
 * Lists the tables of the selected schema. Opening one is not a separate destination — it
 * creates the query that reads it, so a table lands in the same tab, editor and results as
 * any other query.
 */
export const ExplorerNavTables = ({ onBack }: { onBack: () => void }) => {
  const router = useRouter()
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const { openEntityQuery } = useOpenEntityQuery()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const {
    data: entitiesData,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntityTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemas: [selectedSchema],
    search: search.length === 0 ? search : debouncedSearch,
    sort: 'alphabetical',
    filterTypes: TABLE_ENTITY_TYPES,
    limit: 100,
  })

  const tables = useMemo(
    () => entitiesData?.pages.flatMap((page) => page.data.entities) ?? [],
    [entitiesData?.pages]
  )

  const activeQueryId = router.pathname.includes('/explorer/query/') ? id : undefined

  return (
    <ExplorerNavPanel
      label="Tables"
      search={search}
      setSearch={setSearch}
      searchPlaceholder="Search tables"
      onBack={onBack}
    >
      <div className="px-3 pb-2">
        <SchemaSelector
          size="tiny"
          selectedSchemaName={selectedSchema}
          onSelectSchema={setSelectedSchema}
        />
      </div>
      <div className="flex flex-1 min-h-0 flex-col px-3 pb-3">
        {isPending && <GenericSkeletonLoader />}
        {!isPending && tables.length === 0 && (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No tables found' : 'No tables in this schema'}
          </p>
        )}
        {!isPending && tables.length > 0 && (
          <InfiniteListDefault
            className="h-full w-full"
            items={tables}
            itemProps={{ activeQueryId, onOpen: openEntityQuery }}
            ItemComponent={TableListItem}
            LoaderComponent={LoaderForIconMenuItems}
            getItemKey={(index) => {
              const table = tables[index]
              return table ? `${table.schema}.${table.name}` : `table-${index}`
            }}
            getItemSize={() => TABLE_ROW_HEIGHT}
            gap={1}
            hasNextPage={hasNextPage}
            isLoadingNextPage={isFetchingNextPage}
            onLoadNextPage={fetchNextPage}
          />
        )}
      </div>
    </ExplorerNavPanel>
  )
}
