import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavPanel, rowClassName } from './ExplorerLayout.constants'
import {
  entityQueryId,
  type QueryEntityBinding,
} from '@/components/interfaces/Explorer/entityQuery.utils'
import { useOpenEntityQuery, useOpenSchemaVisualizer } from '@/components/interfaces/Explorer/hooks'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ALL_ENTITY_TYPES, EntityTypeFilter } from '@/components/ui/EntityTypeFilter'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import {
  InfiniteListDefault,
  LoaderForIconMenuItems,
  type RowComponentBaseProps,
} from '@/components/ui/InfiniteList'
import { SchemaSelector } from '@/components/ui/SchemaSelector'
import type { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useEntityTypesQuery, type Entity } from '@/data/entity-types/entity-types-infinite-query'
import { useLastSelectedSchema } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTabsStateSnapshot } from '@/state/tabs'

const ENTITY_ROW_HEIGHT = 28

type EntityListItemProps = RowComponentBaseProps<Entity> & {
  activeQueryId: string | undefined
  onOpen: (entity: QueryEntityBinding) => void
}

const EntityListItem = ({ item, style, activeQueryId, onOpen }: EntityListItemProps) => {
  const entity = { schema: item.schema, name: item.name, type: item.type }
  const isActive = activeQueryId === entityQueryId(entity)

  return (
    <button
      type="button"
      tabIndex={0}
      className={rowClassName(isActive)}
      style={style}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onOpen(entity)}
    >
      <EntityTypeIcon type={item.type} size={14} isActive={isActive} />
      <span className={cn('truncate text-left', isActive && 'text-foreground')}>{item.name}</span>
    </button>
  )
}

/**
 * The project's tables, views and other relations in one list, scoped by a schema selector and
 * narrowed by type, like the Table Editor's sidebar. Opening one is not a separate destination:
 * it creates the query that reads it, so it lands in the same tab, editor and results as any
 * other query.
 */
export const ExplorerNavTables = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { openEntityQuery } = useOpenEntityQuery()
  const { openSchemaVisualizer } = useOpenSchemaVisualizer()
  const { selectedSchema, setSelectedSchema } = useLastSelectedSchema()
  const tabs = useTabsStateSnapshot()
  const isVisualizerActive =
    tabs.activeTab !== null && tabs.tabsMap[tabs.activeTab]?.type === 'schema'

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [visibleTypes, setVisibleTypes] = useState<ENTITY_TYPE[]>(ALL_ENTITY_TYPES)
  const hasVisibleTypes = visibleTypes.length > 0

  const {
    data: entitiesData,
    isPending,
    isError,
    error,
    isSuccess,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schemas: [selectedSchema],
      search: search.length === 0 ? search : debouncedSearch,
      sort: 'alphabetical',
      filterTypes: visibleTypes,
      limit: 100,
    },
    { enabled: hasVisibleTypes }
  )

  const entities = useMemo(
    () => entitiesData?.pages.flatMap((page) => page.data.entities) ?? [],
    [entitiesData?.pages]
  )

  const handleSelectSchema = (schema: string) => {
    setSearch('')
    setSelectedSchema(schema)
    // The visualizer has no selector of its own in Explorer, so this one drives it.
    if (isVisualizerActive) openSchemaVisualizer(schema)
  }

  return (
    <ExplorerNavPanel
      label="Tables"
      header={
        <div className="flex items-center gap-2">
          <SchemaSelector
            className="min-w-0 flex-1"
            selectedSchemaName={selectedSchema}
            onSelectSchema={handleSelectSchema}
          />
          <ButtonTooltip
            variant="default"
            size="tiny"
            className="shrink-0 px-1.5"
            aria-label="Visualize schema"
            icon={<EntityTypeIcon type="schema" size={14} />}
            tooltip={{ content: { side: 'bottom', text: 'Visualize schema' } }}
            onClick={() => openSchemaVisualizer(selectedSchema)}
          />
        </div>
      }
      search={search}
      setSearch={setSearch}
      searchPlaceholder="Search tables"
      searchActions={
        <EntityTypeFilter visibleTypes={visibleTypes} onVisibleTypesChange={setVisibleTypes} />
      }
    >
      <div className="flex flex-1 min-h-0 flex-col p-3">
        {!hasVisibleTypes && (
          <div className="flex flex-col items-start gap-2 px-2 py-2">
            <p className="text-xs text-foreground-lighter">All object types are hidden</p>
            <Button size="tiny" variant="default" onClick={() => setVisibleTypes(ALL_ENTITY_TYPES)}>
              Reset filters
            </Button>
          </div>
        )}
        {hasVisibleTypes && isPending && <GenericSkeletonLoader />}
        {hasVisibleTypes && isError && (
          <AlertError error={error} subject="Failed to retrieve tables" />
        )}
        {hasVisibleTypes && isSuccess && entities.length === 0 && (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No results found' : 'No tables or views in this schema'}
          </p>
        )}
        {hasVisibleTypes && isSuccess && entities.length > 0 && (
          <InfiniteListDefault
            className="h-full w-full"
            items={entities}
            itemProps={{ activeQueryId: id, onOpen: openEntityQuery }}
            ItemComponent={EntityListItem}
            LoaderComponent={LoaderForIconMenuItems}
            getItemKey={(index) => {
              const entity = entities[index]
              return entity ? `${entity.schema}.${entity.name}` : `entity-${index}`
            }}
            getItemSize={() => ENTITY_ROW_HEIGHT}
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
