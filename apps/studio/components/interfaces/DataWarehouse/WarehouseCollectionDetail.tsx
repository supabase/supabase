import { RefreshCcw, Rewind, Terminal } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/shadcn/ui/tooltip'
import { Input } from '@ui/components/shadcn/ui/input'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { DatetimeHelper } from '../Settings/Logs/Logs.types'
import dayjs from 'dayjs'
import { useKeyboardShortcuts } from 'components/grid/components/common/Hooks'

const djs = dayjs()
const INTERVALS: DatetimeHelper[] = [
  {
    text: 'Last hour',
    calcFrom: () => djs.subtract(1, 'hour').toISOString(),
    calcTo: () => djs.toISOString(),
    default: true,
  },
  {
    text: 'Last 12 hours',
    calcFrom: () => djs.subtract(12, 'hour').toISOString(),
    calcTo: () => djs.toISOString(),
  },
  {
    text: 'Last day',
    calcFrom: () => djs.subtract(1, 'day').toISOString(),
    calcTo: () => djs.toISOString(),
  },
  {
    text: 'Last 7 days',
    calcFrom: () => djs.subtract(7, 'day').toISOString(),
    calcTo: () => djs.toISOString(),
  },
]

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
    sql: ``,
  })
  const [search, setSearch] = useState('')

  const [filters, setFilters] = useState({
    limit: 100,
    offset: 0,
    search: '',
    interval: {
      to: INTERVALS[0].calcTo(),
      from: INTERVALS[0].calcFrom(),
    },
  })

  useEffect(() => {
    if (collection) {
      const from = filters.interval?.from
      const to = filters.interval?.to

      const sql = `select id, timestamp, event_message from \`${collection.name}\`
where timestamp >= TIMESTAMP('${from}')
${to ? `and timestamp <= TIMESTAMP('${to}')` : ''}
and event_message like '%${filters.search}%'
order by timestamp desc limit ${filters.limit} offset ${filters.offset}
      `

      setParams((prevParams) => ({
        ...prevParams,
        sql,
      }))
    }
  }, [collection, filters])

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
    setFilters({ ...filters, offset: filters.offset + filters.limit })
  }

  const isLoading = queryLoading || collectionsLoading || isRefetching

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFilters({ ...filters, search })
    refetch()
  }

  const queryUrl = `/project/${projectRef}/logs/explorer?q=${encodeURIComponent(
    params.sql || ''
  )}&source=warehouse`

  useKeyboardShortcuts(
    {
      r: () => {
        document.getElementById('refresh-button')?.focus()
      },
      s: () => {
        document.getElementById('search-input')?.focus()
      },
    },
    ['INPUT', 'BUTTON', 'TEXTAREA']
  )

  function KeyboardShortcut({ children }: { children: React.ReactNode }) {
    return (
      <span className="flex items-center gap-2 font-medium text-xs font-mono text-foreground-light border rounded-md px-1.5 py-0.5 border-b-2">
        {children}
      </span>
    )
  }
  return (
    <div className="relative flex flex-col flex-grow h-full">
      <ShimmerLine active={isLoading} />
      <LoadingOpacity active={isLoading}>
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center h-12 px-5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <h2 className="text-foreground-light max-w-60 truncate" title={collection?.name}>
                {collection?.name}
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    id="refresh-button"
                    htmlType="submit"
                    icon={<RefreshCcw />}
                    type="text"
                    loading={isLoading}
                    disabled={isLoading}
                    className="px-1.5"
                  />
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-2">
                  Refresh <KeyboardShortcut>R</KeyboardShortcut>
                </TooltipContent>
              </Tooltip>
              <Input
                type="search"
                id="search-input"
                className="w-52"
                size="tiny"
                placeholder="Search by event message"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <DatePickers
                to={filters.interval?.to}
                from={filters.interval?.from}
                helpers={INTERVALS}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    interval: {
                      to: e.to || '',
                      from: e.from || '',
                    },
                  })
                }
              />
            </form>
            <div className="flex items-center gap-2">
              <Button asChild type={'text'}>
                <Link href={`/project/${projectRef}/settings/warehouse`}>Access tokens</Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild className="px-1.5" type="outline" icon={<Terminal />}>
                    <Link href={queryUrl} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Open query in Collections Explorer
                </TooltipContent>
              </Tooltip>

              <TestCollectionDialog
                accessTokens={accessTokens.data?.data || []}
                collectionToken={collectionToken}
                projectRef={projectRef}
                collections={collections || []}
                open={testDialogOpen}
                onOpenChange={setTestDialogOpen}
                onSubmit={() => {
                  refetch()
                  setTestDialogOpen(false)
                }}
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
                  title="No events found"
                  size="large"
                  ctaButtonLabel="Send test event"
                  onClickCta={() => setTestDialogOpen(true)}
                >
                  <>
                    <p>
                      No events match your current search criteria. <br />
                      Try adjusting your filters or send a test event to populate this collection.
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
            {filters.offset !== 0 && (
              <>
                <Button
                  onClick={() => setFilters({ ...filters, offset: 0 })}
                  type="default"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Load latest
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
