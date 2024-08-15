import { RefreshCcw, Rewind } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useWarehouseAccessTokensQuery } from 'data/analytics/warehouse-access-tokens-query'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import { useFlag } from 'hooks/ui/useFlag'
import { Button } from 'ui'
import LogTable from '../Settings/Logs/LogTable'
import { TestCollectionDialog } from './TestCollectionDialog'

export const WarehouseCollectionDetail = () => {
  const router = useRouter()
  const collectionToken = router.query.collectionToken as string
  const projectRef = router.query.ref as string
  const accessTokens = useWarehouseAccessTokensQuery({ projectRef })
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const hasWarehouse = useFlag('warehouse')

  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    { projectRef },
    { enabled: hasWarehouse }
  )
  const collection = (collections || []).find((c) => c.token === collectionToken)
  const [params, setParams] = useState({
    sql: `select current_timestamp() as 'time'`,
  })

  const [pagination, setPagination] = useState({
    limit: 100,
    offset: 0,
  })

  useEffect(() => {
    if (collection) {
      setParams((prevParams) => ({
        ...prevParams,
        sql: `
        select id, timestamp, event_message from \`${collection.name}\`
        where timestamp > timestamp_sub(current_timestamp(), interval 7 day)
        order by timestamp desc limit ${pagination.limit} offset ${pagination.offset}
        `,
      }))
    }
  }, [collection, pagination])

  const {
    isLoading: queryLoading,
    data: queryData,
    refetch,
    isError,
    isRefetching,
  } = useWarehouseQueryQuery(
    { ref: projectRef, sql: params.sql },
    {
      enabled: !!params.sql && hasWarehouse,
    }
  )

  const formatResults = (results: any) => {
    if (!results || !results.length) {
      return []
    }

    const r = results.map(({ timestamp, ...r }: any) => {
      return {
        timestamp: new Date(timestamp / 1000).toLocaleString(),
        ...r,
      }
    })

    return r
  }

  const results = formatResults(queryData?.result)

  function loadMore() {
    setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
  }

  const isLoading = queryLoading || collectionsLoading || isRefetching

  return (
    <div className="relative flex flex-col flex-grow h-full">
      <ShimmerLine active={isLoading} />
      <LoadingOpacity active={isLoading}>
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center pr-3">
            <h2 className="p-3">{collection?.name}</h2>
            <div className="flex items-center gap-2">
              <Button asChild type={'text'}>
                <Link href={`/project/${projectRef}/settings/warehouse`}>Access tokens</Link>
              </Button>

              <TestCollectionDialog
                accessTokens={accessTokens.data?.data || []}
                collectionToken={collectionToken}
                projectRef={projectRef}
                collections={collections || []}
                open={testDialogOpen}
                onOpenChange={setTestDialogOpen}
              />
            </div>
          </div>

          {isError && (
            <div className="p-4">
              <AlertError subject="Failed to load query results" />
            </div>
          )}

          {!isError && (
            <LogTable
              collectionName={collection?.name}
              queryType="warehouse"
              hasEditorValue={false}
              projectRef={projectRef}
              isLoading={isLoading}
              data={results}
              params={params}
              maxHeight="calc(100vh - 139px)"
              showHeader={false}
              emptyState={
                <ProductEmptyState
                  title="Send your first event"
                  size="large"
                  ctaButtonLabel="Send first event"
                  infoButtonLabel="What Warehouse?"
                  onClickCta={() => setTestDialogOpen(true)}
                >
                  <>
                    <p>
                      No data available for this collection. Send your first event to see data here.
                    </p>
                  </>
                </ProductEmptyState>
              }
            />
          )}
        </div>
      </LoadingOpacity>

      {!isError && (
        <div className="border-t flex flex-row justify-between p-2">
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <>
                <Button
                  onClick={loadMore}
                  icon={<Rewind />}
                  type="default"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Load more
                </Button>
              </>
            )}
            {pagination.offset !== 0 && (
              <>
                <Button
                  onClick={() => setPagination({ ...pagination, offset: 0 })}
                  type="default"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Load latest
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={() => refetch()}
            icon={<RefreshCcw />}
            type="default"
            loading={isLoading}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  )
}
