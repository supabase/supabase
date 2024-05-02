import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import {
  Button,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogTrigger,
  IconRefreshCcw,
  IconRewind,
  Input,
} from 'ui'
import { LogTable } from '../Settings/Logs'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import Link from 'next/link'
import { useWarehouseAccessTokensQuery } from 'data/analytics/warehouse-access-tokens-query'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@ui/components/shadcn/ui/select'
import { TestCollectionDialog } from './TestCollectionDialog'

export const WarehouseCollectionDetail = () => {
  const router = useRouter()
  const collectionToken = router.query.collectionToken as string
  const projectRef = router.query.ref as string
  const accessTokens = useWarehouseAccessTokensQuery({ projectRef })
  const [testAccessToken, setTestAccessToken] = React.useState('')

  const isDevEnv = process.env.NODE_ENV === 'development'

  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    { projectRef },
    { enabled: true }
  )
  const collection = (collections || []).find((c) => c.token === collectionToken)
  const [params, setParams] = React.useState({
    sql: `select current_timestamp() as 'time'`,
  })

  const [pagination, setPagination] = React.useState({
    limit: 100,
    offset: 0,
  })

  useEffect(() => {
    if (collection) {
      setParams({
        ...params,
        sql: `
        select id, timestamp, event_message from \`${collection.name}\` 
        where timestamp > '2024-01-01' 
        order by timestamp desc limit ${pagination.limit} offset ${pagination.offset}
        `,
      })
    }
  }, [collection, pagination])

  const {
    isLoading: queryLoading,
    data: queryData,
    isError,
    refetch,
    isRefetching,
  } = useWarehouseQueryQuery({ ref: projectRef, sql: params.sql }, { enabled: !!params.sql })

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
    console.log({ r, results })

    return r
  }

  const results = formatResults(queryData?.data.result)

  function loadOlder() {
    setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
  }

  const isLoading = queryLoading || collectionsLoading || isRefetching

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
                {isDevEnv && (
                  <TestCollectionDialog
                    accessTokens={accessTokens.data?.data || []}
                    collectionToken={collectionToken}
                  />
                )}
              </div>
            </div>
            <LogTable
              projectRef={projectRef}
              isLoading={isLoading}
              data={results}
              params={params}
              error={isError ? 'Error loading data' : undefined}
              maxHeight="calc(100vh - 139px)"
            />
          </div>
        </LoadingOpacity>

        {!isError && (
          <div className="border-t flex flex-row justify-between p-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={loadOlder}
                icon={<IconRewind />}
                type="default"
                loading={isLoading}
                disabled={isLoading}
              >
                Load older
              </Button>
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
