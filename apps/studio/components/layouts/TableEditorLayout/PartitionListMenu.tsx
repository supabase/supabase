import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
} from 'ui-patterns/InnerSideMenu'

import { EntityListItem, type EntityListItemProps } from './EntityListItem'
import { ErrorMatcher } from '@/components/interfaces/ErrorHandling/ErrorMatcher'
import { EditorMenuListSkeleton } from '@/components/layouts/TableEditorLayout/EditorMenuListSkeleton'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useEntityTypesQuery } from '@/data/entity-types/entity-types-infinite-query'
import { partitionInfoQueryOptions } from '@/data/entity-types/partition-info-query'
import { useTableApiAccessQuery } from '@/data/privileges/table-api-access-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const PARTITION_ENTITY_TYPES = [ENTITY_TYPE.TABLE, ENTITY_TYPE.PARTITIONED_TABLE]

type PartitionListMenuProps = {
  parentId: number
  schema: string
  onViewPartitions: (parentId: number) => void
  onBack: (parentId: number | undefined) => void
  itemProps: Pick<EntityListItemProps, 'projectRef' | 'id' | 'isLocked' | 'onExportCLI'>
}

export const PartitionListMenu = ({
  parentId,
  schema,
  onViewPartitions,
  onBack,
  itemProps,
}: PartitionListMenuProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [searchText, setSearchText] = useState('')

  const { data: parentInfo, isPending: isParentInfoPending } = useQuery(
    partitionInfoQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: parentId,
    })
  )

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
      search: searchText.trim() || undefined,
      sort: 'alphabetical',
      filterTypes: PARTITION_ENTITY_TYPES,
      parentId,
    },
    { placeholderData: searchText ? keepPreviousData : undefined }
  )

  const partitions = useMemo(() => data?.pages.flatMap((page) => page.data.entities), [data?.pages])
  const partitionNames = useMemo(
    () => partitions?.filter((x) => x.schema === schema).map((x) => x.name) ?? [],
    [partitions, schema]
  )

  const { data: apiAccessByTableName } = useTableApiAccessQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString ?? undefined,
      schemaName: schema,
      tableNames: partitionNames,
    },
    { enabled: partitionNames.length > 0 }
  )

  const listItemProps = useMemo(
    () => ({
      ...itemProps,
      apiAccessMap: apiAccessByTableName,
      onViewPartitions,
    }),
    [itemProps, apiAccessByTableName, onViewPartitions]
  )

  const getItemKey = useCallback(
    (index: number) => {
      const item = partitions?.[index]
      return item?.id ? String(item.id) : `table-editor-partition-${index}`
    },
    [partitions]
  )

  const hasPartitions = (partitions?.length ?? 0) > 0

  return (
    <div className="grow min-h-0 flex flex-col gap-2 pb-4">
      <InnerSideBarFilters className="mx-2">
        <InnerSideBarFilterSearchInput
          name="search-partitions"
          value={searchText}
          placeholder="Search partitions..."
          aria-labelledby="Search partitions"
          onChange={(e) => setSearchText(e.target.value)}
        />
      </InnerSideBarFilters>

      <div className="flex items-center gap-x-1 mx-2">
        <Button
          variant="text"
          className="px-1"
          icon={<ArrowLeftIcon />}
          disabled={isParentInfoPending}
          aria-label={
            parentInfo?.parent_id != null ? 'Back to parent partitions' : 'Back to all tables'
          }
          onClick={() => onBack(parentInfo?.parent_id ?? undefined)}
        />
        <span className="text-sm text-foreground-light truncate" title={parentInfo?.name}>
          {parentInfo?.name}
        </span>
      </div>

      {isLoading && <EditorMenuListSkeleton />}

      {isError && (
        <ErrorMatcher
          title="Failed to load partitions"
          error={error ?? 'Failed to load partitions'}
          supportFormParams={{ projectRef: project?.ref }}
          className="mx-4 mt-3"
        />
      )}

      {isSuccess && !hasPartitions && searchText.length === 0 && (
        <InnerSideBarEmptyPanel
          className="mx-2"
          title="No partitions"
          description="This table doesn't have any partitions yet"
        />
      )}
      {isSuccess && !hasPartitions && searchText.length > 0 && (
        <InnerSideBarEmptyPanel
          className="mx-2"
          title="No results found"
          description={`Your search for "${searchText}" did not return any results`}
        />
      )}
      {isSuccess && hasPartitions && (
        <div className="flex flex-1 min-h-0 w-full" data-testid="partitions-list">
          <InfiniteListDefault
            className="h-full w-full"
            items={partitions!}
            ItemComponent={EntityListItem}
            LoaderComponent={LoaderForIconMenuItems}
            itemProps={listItemProps}
            getItemKey={getItemKey}
            getItemSize={() => 28}
            hasNextPage={hasNextPage}
            isLoadingNextPage={isFetchingNextPage}
            onLoadNextPage={fetchNextPage}
          />
        </div>
      )}
    </div>
  )
}
