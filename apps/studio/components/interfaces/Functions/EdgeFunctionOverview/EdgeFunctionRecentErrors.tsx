import { CheckIcon, ExternalLinkIcon, EyeIcon } from 'lucide-react'
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

import {
  EDGE_FUNCTION_LOGS_VIEW,
  getEdgeFunctionLogsScope,
  getEdgeFunctionLogsUrl,
  getLegacyEdgeFunctionLogsUrl,
} from './EdgeFunctionOverview.utils'
import {
  getSinceLastDeployInvocationPhrase,
  getSinceLastDeployLogRange,
} from './EdgeFunctionRecentErrors.utils'
import { EdgeFunctionRecentErrorsActions } from './EdgeFunctionRecentErrorsActions'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EmbeddedLogsTable } from '@/components/interfaces/UnifiedLogs/components/EmbeddedLogsTable'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import {
  createUnifiedLogsSearch,
  getFacetValueCount,
  getUniqueLogRows,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'

const ERROR_LOG_FILTERS = ['level:eq:error']

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

  const { errorsSearch, countsSearch } = useMemo(() => {
    const scope = functionId ? getEdgeFunctionLogsScope(functionId) : undefined
    const date =
      isoTimestampStart && isoTimestampEnd
        ? [new Date(isoTimestampStart), new Date(isoTimestampEnd)]
        : null
    return {
      errorsSearch: createUnifiedLogsSearch({ filter: ERROR_LOG_FILTERS, date }, scope),

      countsSearch: createUnifiedLogsSearch({ date }, scope),
    }
  }, [functionId, isoTimestampStart, isoTimestampEnd])
  const isQueryEnabled = Boolean(projectRef && functionId && isoTimestampStart)

  const { data, error, isError, isPending, isFetching } = useUnifiedLogsInfiniteQuery(
    { projectRef, search: errorsSearch, pageSize: MAX_VISIBLE_ERRORS },
    { enabled: isQueryEnabled, placeholderData: undefined }
  )
  const { data: counts } = useUnifiedLogsCountQuery(
    { projectRef, search: countsSearch },
    { enabled: isQueryEnabled }
  )

  const rows = useMemo(() => getUniqueLogRows<ColumnSchema>(data?.pages), [data?.pages])

  const errorCount = counts ? getFacetValueCount(counts.facets, 'level', 'error') : rows.length
  const hiddenErrorCount = Math.max(errorCount - rows.length, 0)
  const invocationCount = counts
    ? getFacetValueCount(counts.facets, 'log_type', 'edge function')
    : undefined

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

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Errors in the last 24h</PageSectionTitle>
        </PageSectionSummary>
        <PageSectionAside>
          <EdgeFunctionRecentErrorsActions rows={rows} omittedCount={hiddenErrorCount} />
          <Button size="tiny" icon={<ExternalLinkIcon size={14} />} onClick={handleOpenLogs}>
            View logs
          </Button>
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {hasNoErrors && (
          <div className="rounded-md border border-dashed px-5 py-6 text-sm text-foreground-light">
            <div className="flex items-start gap-3">
              {invocationCount !== undefined && invocationCount > 0 && (
                <CheckIcon
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              )}
              {invocationCount === 0 && (
                <EyeIcon
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-foreground-muted"
                  aria-hidden="true"
                />
              )}
              <div>
                {invocationCount !== undefined ? (
                  <>
                    There {invocationCount === 1 ? 'has' : 'have'} been{' '}
                    <span className="text-foreground">
                      {getSinceLastDeployInvocationPhrase(invocationCount)}
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
              columnPreferencesKey={EDGE_FUNCTION_LOGS_VIEW.columnPreferencesKey}
              footer={
                hiddenErrorCount > 0 && (
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
