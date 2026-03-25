import { IS_PLATFORM } from 'common'
import { useParams } from 'common/hooks'
import dayjs from 'dayjs'
import { Check, Copy } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState, type MouseEvent } from 'react'
import { cn, copyToClipboard, TableCell, TableRow } from 'ui'
import { ShimmeringLoader, TimestampInfo } from 'ui-patterns'

import { formatErrorRate } from './EdgeFunctionsListItem.utils'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionsLastHourStatsQuery } from '@/data/edge-functions/edge-functions-last-hour-stats-query'
import {
  useEdgeFunctionsQuery,
  type EdgeFunctionsResponse,
} from '@/data/edge-functions/edge-functions-query'
import { normalizeFunctionIds } from '@/data/edge-functions/keys'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { createNavigationHandler } from '@/lib/navigation'

interface EdgeFunctionsListItemProps {
  function: EdgeFunctionsResponse
}

export const EdgeFunctionsListItem = ({ function: item }: EdgeFunctionsListItemProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const [isCopied, setIsCopied] = useState(false)

  const showEdgeFunctionsRequestMetrics = usePHFlag<boolean>('edgeFunctionsRequestMetrics') === true
  const showLastHourStats = IS_PLATFORM && showEdgeFunctionsRequestMetrics

  const { data: endpoint } = useProjectApiUrl({ projectRef: ref })
  const functionUrl = `${endpoint}/functions/v1/${item.slug}`

  const handleNavigation = createNavigationHandler(
    `/project/${ref}/functions/${item.slug}${IS_PLATFORM ? '' : `/details`}`,
    router
  )

  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })
  const functionIds = useMemo(() => {
    if (!showLastHourStats || !functions) return []
    return normalizeFunctionIds(functions.map((item) => item.id))
  }, [functions, showLastHourStats])

  // [Joshen] We may be paginating the edge functions query in the future
  // So this will eventually need to be a list of visibleFunctionIds instead + debounced
  const {
    data: lastHourStatsAll,
    isPending: isStatsPending,
    isError: isStatsError,
  } = useEdgeFunctionsLastHourStatsQuery(
    { projectRef: ref, functionIds },
    { enabled: showLastHourStats }
  )
  const lastHourStats = lastHourStatsAll?.[item.id]

  return (
    <TableRow
      key={item.id}
      onClick={handleNavigation}
      onAuxClick={handleNavigation}
      onKeyDown={handleNavigation}
      tabIndex={0}
      className="cursor-pointer inset-focus"
    >
      <TableCell>
        <p className="text-sm text-foreground whitespace-nowrap py-2">{item.name}</p>
      </TableCell>
      <TableCell>
        <div className="text-xs text-foreground-light flex gap-2 items-center truncate">
          <p title={functionUrl} className="font-mono truncate hidden md:inline max-w-[30rem]">
            {functionUrl}
          </p>
          <button
            type="button"
            className="text-foreground-lighter hover:text-foreground transition"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              function onCopy(value: string) {
                setIsCopied(true)
                copyToClipboard(value)
                setTimeout(() => setIsCopied(false), 3000)
              }
              event.stopPropagation()
              onCopy(functionUrl)
            }}
          >
            {isCopied ? (
              <div className="text-brand">
                <Check size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className="relative">
                <div className="block">
                  <Copy size={14} strokeWidth={1.5} />
                </div>
              </div>
            )}
          </button>
        </div>
      </TableCell>
      <TableCell className="hidden 2xl:table-cell whitespace-nowrap">
        <TimestampInfo
          className="text-sm text-foreground-light whitespace-nowrap"
          utcTimestamp={item.created_at}
          label={dayjs(item.created_at).fromNow()}
        />
      </TableCell>
      <TableCell className="lg:table-cell">
        <TimestampInfo
          className="text-sm text-foreground-light whitespace-nowrap"
          utcTimestamp={item.updated_at}
          label={dayjs(item.updated_at).fromNow()}
        />
      </TableCell>
      {showLastHourStats && (
        <>
          <TableCell className="lg:table-cell whitespace-nowrap">
            {isStatsPending ? (
              <ShimmeringLoader className="w-12" />
            ) : isStatsError ? (
              <p className="text-foreground-lighter" title="Failed to load stats">
                -
              </p>
            ) : (
              <p className="text-foreground-light">
                {lastHourStats !== undefined ? lastHourStats.requestsCount.toLocaleString() : '-'}
              </p>
            )}
          </TableCell>
          <TableCell className="lg:table-cell whitespace-nowrap">
            {isStatsPending ? (
              <ShimmeringLoader className="w-12" />
            ) : isStatsError ? (
              <p className="text-foreground-lighter" title="Failed to load stats">
                -
              </p>
            ) : lastHourStats !== undefined ? (
              <span
                className={cn(
                  'text-sm',
                  lastHourStats.errorRate >= 1
                    ? 'text-destructive'
                    : lastHourStats.errorRate > 0.1
                      ? 'text-warning'
                      : 'text-foreground-light'
                )}
              >
                {formatErrorRate(lastHourStats.errorRate)}
              </span>
            ) : (
              <p className="text-foreground-lighter">-</p>
            )}
          </TableCell>
        </>
      )}
      <TableCell className="hidden 2xl:table-cell">
        <p className="text-foreground-light">{item.version}</p>
        <button tabIndex={-1} className="sr-only">
          Go to function details
        </button>
      </TableCell>
    </TableRow>
  )
}
