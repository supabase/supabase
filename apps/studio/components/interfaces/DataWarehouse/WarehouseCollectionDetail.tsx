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
  IconFastForward,
  IconRefreshCcw,
  IconRewind,
  Input,
} from 'ui'
import { LogTable } from '../Settings/Logs'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import Link from 'next/link'
import { RefreshCwIcon } from 'lucide-react'
import { BackwardIcon } from '@heroicons/react/16/solid'

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
  } = useWarehouseQueryQuery({ ref: projectRef, sql: params.sql }, { enabled: !!params.sql })

  const formatResults = (results: any) => {
    if (!results || !results.length) {
      return []
    }

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

  function loadOlder() {
    setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
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
                <Dialog>
                  <DialogTrigger>
                    <Button type="outline">Connect</Button>
                  </DialogTrigger>
                  <DialogContent className="p-3">
                    <h2>Send events to this collection using the following endpoint</h2>
                    <Input
                      copy
                      className="font-mono tracking-tighter"
                      value={`https://api.logflare.app/logs?source=${collectionToken}`}
                    />
                    <p className="flex items-center">
                      Replace <code className="inline text-xs">[ACCESS_TOKEN]</code> with your
                      access token.
                    </p>
                    <CodeBlock language="bash" className="language-bash prose dark:prose-dark max-">
                      {`
curl -X "POST" "https://api.logflare.app/logs?source=${collectionToken}" \\
-H 'Content-Type: application/json' \\
-H 'X-API-KEY: [ACCESS_TOKEN]' \\
-d $'{
  "event_message": "This is another log message.",
  "metadata": {
    "ip_address": "100.100.100.100",
    "request_method": "POST",
    "custom_user_data": {
      "vip": true,
      "id": 38,
      "login_count": 154,
      "company": "Supabase",
      "address": {
        "zip": "11111",
        "st": "NY",
        "street": "123 W Main St",
        "city": "New York"
      }
    },
    "datacenter": "aws",
    "request_headers": {
      "connection": "close",
      "user_agent": "chrome"
    }
  }
}'
                      `}
                    </CodeBlock>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <LogTable
              projectRef={projectRef}
              isLoading={isLoading}
              hideHeader={true}
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
                  <span className="text-xs">
                    Showing {pagination.offset + 1} - {pagination.offset + pagination.limit}
                  </span>
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
