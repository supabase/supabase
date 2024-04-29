import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { Button, IconRefreshCcw, IconRewind } from 'ui'
import { LogTable } from '../Settings/Logs'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import Link from 'next/link'

export const WarehouseCollectionDetail = () => {
  const router = useRouter()
  const collectionToken = router.query.collectionToken as string
  const projectRef = router.query.ref as string
  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    { projectRef },
    { enabled: true }
  )
  const collection = (collections || []).find((c) => c.token === collectionToken)
  const [params, setParams] = React.useState({
    sql: `select current_timestamp() as 'time'`,
  })

  useEffect(() => {
    if (collection) {
      setParams({
        ...params,
        sql: `
        select id, timestamp, event_message from \`${collection.name}\` 
        where timestamp > '2024-01-01' 
        order by timestamp desc limit 100
        `,
      })
    }
  }, [collection])

  const {
    isLoading: queryLoading,
    data: queryData,
    isError,
    refetch,
  } = useWarehouseQueryQuery({ ref: projectRef, sql: params.sql }, { enabled: !!params.sql })

  const formatResults = (results: any) => {
    const r = results.map(({ timestamp, ...r }: any) => {
      return {
        timestamp: new Date(timestamp).toLocaleString(),
        ...r,
      }
    })
    console.log({ r, results })

    return r
  }

  const results = formatResults(queryData?.data.result)

  const isLoadingOlder = false
  function loadOlder() {
    console.log('loadOlder')
  }

  const isLoading = queryLoading || collectionsLoading

  return (
    <>
      <div className="relative flex flex-col flex-grow h-full">
        <ShimmerLine active={isLoading} />
        <LoadingOpacity active={isLoading}>
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center pr-3">
              <h2 className="p-3">{collection?.name}</h2>
              <div className="flex items-center gap-2">
                <Button asChild type={'text'}>
                  <Link href={`/project/${projectRef}/logs/collections/access-tokens`}>
                    Access tokens
                  </Link>
                </Button>
                <Button type="outline">Connect</Button>
              </div>
            </div>
            <LogTable
              projectRef={projectRef}
              isLoading={isLoading}
              hideHeader={true}
              data={results}
              params={params}
              error={isError ? 'Error loading data' : undefined}
              maxHeight="calc(100vh - 3rem - 44px)"
            />
          </div>
        </LoadingOpacity>

        {!isError && (
          <div className="border-t flex flex-row justify-between p-2">
            <Button
              onClick={loadOlder}
              icon={<IconRewind />}
              type="default"
              loading={isLoadingOlder}
              disabled={isLoadingOlder}
            >
              Load older
            </Button>
            <Button
              onClick={() => refetch()}
              icon={<IconRefreshCcw />}
              type="default"
              loading={isLoading}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
