import { PostgresPolicy } from '@supabase/postgres-meta'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronUp, Search, X } from 'lucide-react'
import { forwardRef, useEffect, useState, type HTMLAttributes, type ReactNode } from 'react'

import { useMainScrollContainer } from 'components/layouts/MainScrollContainerContext'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { type Bucket } from 'data/storage/buckets-query'
import { useStaticEffectEvent } from 'hooks/useStaticEffectEvent'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { StoragePoliciesBucketRow } from './StoragePoliciesBucketRow'
import StoragePoliciesPlaceholder from './StoragePoliciesPlaceholder'

export type SelectBucketPolicyForAction = {
  addPolicy: (bucketName?: string, table?: string) => void
  editPolicy: (policy: PostgresPolicy, bucketName?: string, table?: string) => void
  deletePolicy: (policy: PostgresPolicy) => void
}

type BucketsPoliciesProps = {
  buckets: { bucket: Bucket; policies: PostgresPolicy[] }[]
  search?: string
  debouncedSearch?: string
  setSearch: (search: string) => void
  actions: SelectBucketPolicyForAction
  pagination: {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    fetchNextPage: () => void
  }
}

export const BucketsPolicies = ({
  buckets,
  search,
  debouncedSearch,
  setSearch,
  actions,
  pagination,
}: BucketsPoliciesProps): ReactNode => {
  const [expanded, setExpanded] = useState(true)

  const showEmptyState = buckets.length === 0 && (!debouncedSearch || debouncedSearch.length === 0)

  return (
    <PageSection>
      <Collapsible_Shadcn_ open={expanded} onOpenChange={setExpanded}>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Buckets</PageSectionTitle>
            <PageSectionDescription>
              Write policies for each bucket to control access to the bucket and its contents
            </PageSectionDescription>
          </PageSectionSummary>
          <CollapsibleTrigger_Shadcn_ asChild>
            <button>
              <span className="sr-only">Toggle bucket list</span>
              <ChevronUp
                size={14}
                className={cn(
                  !expanded && 'rotate-180',
                  'transition',
                  'text-foreground-light hover:text-foreground'
                )}
              />
            </button>
          </CollapsibleTrigger_Shadcn_>
        </PageSectionMeta>
        <CollapsibleContent_Shadcn_>
          <PageSectionContent className="mt-6">
            {showEmptyState && <StoragePoliciesPlaceholder />}

            {buckets.length > 0 && (
              <div className="mb-4">
                <Input
                  size="tiny"
                  placeholder="Filter buckets"
                  className="block"
                  containerClassName="w-full lg:w-52"
                  value={search || ''}
                  onChange={(e) => {
                    const str = e.target.value
                    setSearch(str)
                  }}
                  icon={<Search />}
                  actions={
                    search ? (
                      <Button
                        size="tiny"
                        type="text"
                        className="p-0 h-5 w-5"
                        icon={<X />}
                        onClick={() => setSearch('')}
                      />
                    ) : null
                  }
                />
              </div>
            )}

            {!!search && search.length > 0 && buckets.length === 0 && (
              <NoSearchResults searchString={search} onResetFilter={() => setSearch('')} />
            )}

            <BucketsPoliciesVirtualizedList
              items={buckets}
              actions={actions}
              pagination={pagination}
            />
          </PageSectionContent>
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
    </PageSection>
  )
}

type BucketsPoliciesVirtualizedListProps = {
  items: { bucket: Bucket; policies: PostgresPolicy[] }[]
  actions: SelectBucketPolicyForAction
  pagination: BucketsPoliciesProps['pagination']
}

const BucketsPoliciesVirtualizedList = ({
  items,
  actions,
  pagination,
}: BucketsPoliciesVirtualizedListProps) => {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pagination

  const itemCount = hasNextPage ? items.length + 1 : items.length

  const scrollElement = useMainScrollContainer()
  const virtualizer = useVirtualizer({
    count: itemCount,
    estimateSize: () => 129,
    overscan: 5,
    getItemKey: (index) => items[index]?.bucket.name ?? `bucket-${index}`,
    getScrollElement: () => scrollElement,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]

  const fetchNext = useStaticEffectEvent(() => {
    if (lastItem && lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  })
  useEffect(fetchNext, [lastItem, fetchNext])

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const isLoaderRow = virtualRow.index > items.length - 1
        const commonStyle = {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
        }

        if (isLoaderRow) {
          return (
            <BucketsPoliciesLoader
              key={`loader-${virtualRow.index}`}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="pb-4"
              style={commonStyle}
            />
          )
        }

        const item = items[virtualRow.index]
        if (!item) return null

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="pb-4"
            style={commonStyle}
          >
            <StoragePoliciesBucketRow
              table="objects"
              label={item.bucket.name}
              bucket={item.bucket}
              policies={item.policies}
              onSelectPolicyAdd={actions.addPolicy}
              onSelectPolicyEdit={actions.editPolicy}
              onSelectPolicyDelete={actions.deletePolicy}
            />
          </div>
        )
      })}
    </div>
  )
}

type BucketsPoliciesLoaderProps = HTMLAttributes<HTMLDivElement>

const BucketsPoliciesLoader = forwardRef<HTMLDivElement, BucketsPoliciesLoaderProps>(
  (props: BucketsPoliciesLoaderProps, ref) => (
    <div ref={ref} {...props}>
      <p className="sr-only">Loading more...</p>
      <ShimmeringLoader />
    </div>
  )
)
BucketsPoliciesLoader.displayName = 'BucketsPoliciesLoader'
