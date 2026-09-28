import { Check, ExternalLink, Eye } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { Button, Card } from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { getEdgeFunctionLogsUrl, getLegacyEdgeFunctionLogsUrl } from './EdgeFunctionOverview.utils'
import {
  getSinceLastDeployInvocationCount,
  getSinceLastDeployInvocationCountSql,
  getSinceLastDeployInvocationPhrase,
  getSinceLastDeployLogRange,
} from './EdgeFunctionRecentErrors.utils'
import { EdgeFunctionRecentErrorsActions } from './EdgeFunctionRecentErrorsActions'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EmbeddedLogsTable } from '@/components/interfaces/UnifiedLogs/components/EmbeddedLogsTable'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import {
  getUniqueLogRows,
  loadUnifiedLogsSearchParams,
  toQuerySearchParams,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useLogsQuery } from '@/hooks/analytics/useLogsQuery'

// Error invocations (5xx) and runtime errors, as the Logs tab's level filter defines them
const ERROR_LOG_FILTERS = ['level:eq:error']
// The overview previews the latest errors; the rest are a click away in the Logs tab
const MAX_VISIBLE_ERRORS = 5

interface EdgeFunctionRecentErrorsProps {
  functionId?: string
  functionSlug?: string
  projectRef?: string
  updatedAt?: string | number
}

export const EdgeFunctionRecentErrors = ({
  functionId,
  functionSlug,
  projectRef,
  updatedAt,
}: EdgeFunctionRecentErrorsProps) => {
  const router = useRouter()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const { isoTimestampStart, isoTimestampEnd } = useMemo(
    () => getSinceLastDeployLogRange(updatedAt),
    [updatedAt]
  )

  // Built from the same URL params the Logs tab reads, so both run the same queries
  const search = useMemo(
    () =>
      toQuerySearchParams(
        {
          ...loadUnifiedLogsSearchParams(new URLSearchParams()),
          filter: ERROR_LOG_FILTERS,
          date:
            isoTimestampStart && isoTimestampEnd
              ? [new Date(isoTimestampStart), new Date(isoTimestampEnd)]
              : null,
        },
        functionId ? { functionId } : undefined
      ),
    [functionId, isoTimestampStart, isoTimestampEnd]
  )
  const isQueryEnabled = Boolean(projectRef && functionId && isoTimestampStart)

  const { data, error, isError, isPending, isFetching } = useUnifiedLogsInfiniteQuery(
    { projectRef, search },
    { enabled: isQueryEnabled }
  )
  const { data: counts } = useUnifiedLogsCountQuery(
    { projectRef, search },
    { enabled: isQueryEnabled }
  )

  const {
    logData: sinceLastDeployInvocationCountRows,
    error: sinceLastDeployInvocationCountError,
  } = useLogsQuery({
    projectRef: projectRef!,
    initialParams: {
      sql: getSinceLastDeployInvocationCountSql(functionId),
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
    },
    enabled: isQueryEnabled,
    options: { useOtel: true },
  })
  const sinceLastDeployInvocationCount = getSinceLastDeployInvocationCount(
    sinceLastDeployInvocationCountRows
  )

  const fetchedRows = useMemo(() => getUniqueLogRows<ColumnSchema>(data?.pages), [data?.pages])
  const rows = useMemo(() => fetchedRows.slice(0, MAX_VISIBLE_ERRORS), [fetchedRows])
  // Falls back to the fetched page until the count query resolves
  const totalErrorCount = counts?.totalRowCount ?? fetchedRows.length
  const hiddenErrorCount = Math.max(totalErrorCount - rows.length, 0)

  // Without unified logs, invocations and runtime output live on separate tabs
  const getLogsUrl = (row?: ColumnSchema) => {
    const target = {
      projectRef: projectRef ?? '',
      functionSlug: functionSlug ?? '',
      start: isoTimestampStart,
      end: isoTimestampEnd,
      logId: row?.id,
    }
    if (isUnifiedLogsEnabled) {
      return getEdgeFunctionLogsUrl({ ...target, filters: ERROR_LOG_FILTERS })
    }
    const tab = row?.log_type === 'edge function' ? 'invocations' : 'logs'
    return getLegacyEdgeFunctionLogsUrl({ ...target, tab })
  }
  const handleOpenLogs = () => router.push(getLogsUrl())
  const handleOpenLog = (logId: string) => {
    router.push(getLogsUrl(rows.find((row) => row.id === logId)))
  }

  const isLoading = !functionId || (isQueryEnabled && isPending)
  const hasNoErrors = !isLoading && !isError && rows.length === 0
  const hasInvocationCount = !!isoTimestampStart && !sinceLastDeployInvocationCountError

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Errors in the last 24h</PageSectionTitle>
        </PageSectionSummary>
        <PageSectionAside>
          <EdgeFunctionRecentErrorsActions rows={rows} omittedCount={hiddenErrorCount} />
          <Button size="tiny" icon={<ExternalLink size={14} />} onClick={handleOpenLogs}>
            View logs
          </Button>
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {hasNoErrors && (
          <div className="rounded-md border border-dashed px-5 py-6 text-sm text-foreground-light">
            <div className="flex items-start gap-3">
              {hasInvocationCount && sinceLastDeployInvocationCount > 0 && (
                <Check
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              )}
              {hasInvocationCount && sinceLastDeployInvocationCount === 0 && (
                <Eye
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-foreground-muted"
                  aria-hidden="true"
                />
              )}
              <div>
                {hasInvocationCount ? (
                  <>
                    There {sinceLastDeployInvocationCount === 1 ? 'has' : 'have'} been{' '}
                    <span className="text-foreground">
                      {getSinceLastDeployInvocationPhrase(sinceLastDeployInvocationCount)}
                    </span>{' '}
                    since last deploy and no errors.
                  </>
                ) : (
                  'Runtime errors since the last deploy will appear here when this function returns a 5xx response.'
                )}
              </div>
            </div>
          </div>
        )}

        {!hasNoErrors && (
          <Card className="overflow-hidden">
            <EmbeddedLogsTable
              rows={rows}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              isError={isError}
              onRowClick={handleOpenLog}
              skeletonRowCount={MAX_VISIBLE_ERRORS}
              footer={
                hiddenErrorCount > 0 && (
                  // Sized to its label so the Button's press-scale stays centered on the text
                  <div className="px-0.5 py-0.5">
                    <Button
                      variant="text"
                      size="tiny"
                      className="text-foreground-lighter"
                      onClick={handleOpenLogs}
                    >
                      +{hiddenErrorCount.toLocaleString('en-US')} more
                    </Button>
                  </div>
                )
              }
            />
          </Card>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
