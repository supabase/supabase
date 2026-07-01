import { useMonaco } from '@monaco-editor/react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import type { editor } from 'monaco-editor'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import {
  detectLogSource,
  looksLikeLegacyLogsQuery,
  rewriteLogsSqlWithAI,
} from '@/components/interfaces/Settings/Logs/logs-sql-rewrite'
import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
  getLogsTemplates,
  LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD,
} from '@/components/interfaces/Settings/Logs/Logs.constants'
import { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { LogData, LogsWarning, LogTemplate } from '@/components/interfaces/Settings/Logs/Logs.types'
import { UpdateSavedQueryModal } from '@/components/interfaces/Settings/Logs/Logs.UpdateSavedQueryModal'
import {
  maybeShowUpgradePromptIfNotEntitled,
  useEditorHints,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import {
  buildLogQueryParams,
  resolveLogDateRange,
} from '@/components/interfaces/Settings/Logs/logsDateRange'
import { LogsExplorerOtelBanner } from '@/components/interfaces/Settings/Logs/LogsExplorerOtelBanner'
import { LogsQueryPanel } from '@/components/interfaces/Settings/Logs/LogsQueryPanel'
import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { DiffEditor } from '@/components/ui/DiffEditor'
import LoadingOpacity from '@/components/ui/LoadingOpacity'
import ShimmerLine from '@/components/ui/ShimmerLine'
import { useContentQuery } from '@/data/content/content-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from '@/data/content/content-upsert-mutation'
import { constructHeaders } from '@/data/fetchers'
import { fetchOtelLogKeys } from '@/data/logs/otel-log-keys-query'
import { useLogsQuery } from '@/hooks/analytics/useLogsQuery'
import { useLogsUrlState } from '@/hooks/analytics/useLogsUrlState'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useUpgradePrompt } from '@/hooks/misc/useUpgradePrompt'
import { uuidv4 } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'
import type { LogSqlSnippets, NextPageWithLayout } from '@/types'

type SaveQueryFormValues = { name: string; description?: string }

const LOCAL_PLACEHOLDER_QUERY =
  'select\n  timestamp, event_message, metadata\n  from edge_logs limit 5'

const PLATFORM_PLACEHOLDER_QUERY =
  'select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nlimit 5'

const OTEL_PLACEHOLDER_QUERY =
  "select\n  timestamp,\n  event_message,\n  log_attributes\nfrom logs\nwhere source = 'edge_logs'\norder by timestamp desc\nlimit 5"

const otelSourceQuery = (source: string) =>
  `select\n  timestamp,\n  event_message,\n  log_attributes\nfrom logs\nwhere source = '${source}'\norder by timestamp desc\nlimit 100`

export const LogsExplorerPage: NextPageWithLayout = () => {
  useEditorHints()
  const monaco = useMonaco()
  const router = useRouter()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { ref, q, queryId } = useParams()
  const track = useTrack()
  const projectRef = ref as string
  const { logsShowMetadataIpTemplate } = useIsFeatureEnabled(['logs:show_metadata_ip_template'])
  const useOtelEndpoint = useFlag('otelLegacyLogs')

  const allTemplates = useMemo(() => {
    const templates = getLogsTemplates(useOtelEndpoint)
    if (logsShowMetadataIpTemplate) return templates
    else return templates.filter((x) => x.label !== 'Metadata IP')
  }, [logsShowMetadataIpTemplate, useOtelEndpoint])

  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const [editorId] = useState<string>(uuidv4())
  const { search, setSearch, timestampStart, timestampEnd, setTimeRange } = useLogsUrlState()
  const defaultHelper = useMemo(() => getDefaultHelper(EXPLORER_DATEPICKER_HELPERS), [])
  const initialDatePickerValue = useMemo<DatePickerValue>(() => {
    if (timestampStart && timestampEnd) {
      return { from: timestampStart, to: timestampEnd, isHelper: false }
    }
    if (timestampStart) {
      return { from: timestampStart, to: timestampEnd || '', isHelper: false }
    }
    return {
      from: defaultHelper.calcFrom(),
      to: defaultHelper.calcTo(),
      isHelper: true,
      text: defaultHelper.text,
    }
  }, [timestampStart, timestampEnd, defaultHelper])
  const [datePickerValue, setDatePickerValue] = useState<DatePickerValue>(initialDatePickerValue)

  const { logsDefaultQuery } = useCustomContent(['logs:default_query'])
  const PLACEHOLDER_QUERY = useOtelEndpoint
    ? OTEL_PLACEHOLDER_QUERY
    : IS_PLATFORM
      ? (logsDefaultQuery ?? PLATFORM_PLACEHOLDER_QUERY)
      : LOCAL_PLACEHOLDER_QUERY

  const [editorValue, setEditorValue] = useState<string>(PLACEHOLDER_QUERY)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false)
  const [warnings, setWarnings] = useState<LogsWarning[]>([])
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null)
  const [rewriteProposal, setRewriteProposal] = useState<{
    original: string
    modified: string
  } | null>(null)
  const [isRewriting, setIsRewriting] = useState<boolean>(false)
  const [rewriteBannerDismissed, setRewriteBannerDismissed] = useLocalStorage<boolean>(
    `project-${projectRef}-logs-rewrite-banner-dismissed`,
    false
  )

  const [recentLogs, setRecentLogs] = useLocalStorage<LogSqlSnippets.Content[]>(
    `project-content-${projectRef}-recent-log-sql`,
    []
  )

  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const { data: content } = useContentQuery({
    projectRef: ref,
    type: 'log_sql',
  })
  const query = content?.content.find((x) => x.id === queryId)

  const resolvedRange = useMemo(() => {
    if (datePickerValue.isHelper) {
      return resolveLogDateRange(datePickerValue)
    }
    if (timestampStart && timestampEnd) {
      return { from: timestampStart, to: timestampEnd }
    }
    return resolveLogDateRange(datePickerValue)
  }, [timestampStart, timestampEnd, datePickerValue])

  const {
    params,
    logData,
    error,
    isLoading: logsLoading,
    setParams,
  } = useLogsQuery(
    projectRef,
    {
      iso_timestamp_start: resolvedRange.from,
      iso_timestamp_end: resolvedRange.to,
    },
    true,
    { useOtel: useOtelEndpoint }
  )

  const results = logData
  const isLoading = logsLoading

  const showRewriteCTA = useOtelEndpoint && looksLikeLegacyLogsQuery(editorValue)

  const { mutateAsync: upsertContent, isPending: isUpsertingContent } = useContentUpsertMutation({
    onError: (e) => {
      const error = e as { message: string }
      console.error(error)
      setSaveModalOpen(false)
      if (queryId) {
        toast.error(`Failed to update query: ${error.message}`)
      } else {
        toast.error(`Failed to save query: ${error.message}`)
      }
    },
    onSuccess: (_data, vars) => {
      setSaveModalOpen(false)
      if (queryId) {
        toast.success(`Updated "${vars.payload.name}" log query`)
      } else {
        toast.success(`Saved "${vars.payload.name}" log query`)
      }
    },
  })

  const addRecentLogSqlSnippet = (snippet: Partial<LogSqlSnippets.Content>) => {
    const defaults: LogSqlSnippets.Content = {
      schema_version: '1',
      sql: '',
      content_id: '',
    }
    setRecentLogs([...recentLogs, { ...defaults, ...snippet }])
  }

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(
    params.iso_timestamp_start as string
  )

  const onSelectTemplate = (template: LogTemplate) => {
    if (editorRef.current && monaco) {
      const editorModel = editorRef.current?.getModel()

      editorRef.current.pushUndoStop()
      editorRef.current.executeEdits(`insert-identifier`, [
        {
          text: template.searchString,
          range: editorModel?.getFullModelRange() ?? new monaco.Range(1, 1, 1, 1),
        },
      ])
      editorRef.current.pushUndoStop()
      editorRef.current.focus()
    }

    addRecentLogSqlSnippet({ sql: template.searchString })
  }

  const handleRewrite = async () => {
    const currentSql = editorRef.current?.getValue() ?? editorValue
    if (!currentSql.trim()) {
      toast.info('Write a query to rewrite first')
      return
    }
    setIsRewriting(true)
    try {
      const headerData = await constructHeaders()
      const source = detectLogSource(currentSql)
      const availableKeys = source
        ? await fetchOtelLogKeys({ projectRef, source }).catch(() => undefined)
        : undefined
      const rewritten = await rewriteLogsSqlWithAI({
        sql: currentSql,
        projectRef,
        connectionString: project?.connectionString,
        orgSlug: organization?.slug,
        authorizationHeader: headerData.get('Authorization'),
        availableKeys,
      })
      // The editor may have changed while awaiting key discovery and the AI call;
      // don't offer a proposal that would clobber intervening edits.
      const latestSql = editorRef.current?.getValue() ?? editorValue
      if (latestSql !== currentSql) {
        toast.info('The query changed while rewriting. Please try again.')
        return
      }
      setRewriteProposal({ original: currentSql, modified: rewritten })
    } catch (error) {
      toast.error(`Couldn't rewrite the query: ${(error as Error).message}`)
    } finally {
      setIsRewriting(false)
    }
  }

  const acceptRewrite = () => {
    if (!rewriteProposal) return
    editorRef.current?.setValue(rewriteProposal.modified)
    setEditorValue(rewriteProposal.modified)
    setRewriteProposal(null)
    toast.success('Applied the ClickHouse rewrite')
  }

  const discardRewrite = () => setRewriteProposal(null)

  const handleRun = (value?: string | React.MouseEvent) => {
    track('log_explorer_query_run_button_clicked', { is_saved_query: !!queryId })

    // Read the latest value straight from the editor instance rather than from
    // `editorValue` state, which can lag behind the most recent keystroke. This
    // keeps the Run button consistent with the Cmd+Enter keybinding.
    const liveValue = editorRef.current?.getValue()
    const query = typeof value === 'string' ? value || editorValue : (liveValue ?? editorValue)
    const resolvedParams = buildLogQueryParams(datePickerValue, query)

    setSelectedLog(null)
    setParams((prev) => ({
      ...prev,
      sql: resolvedParams.sql,
      iso_timestamp_start: resolvedParams.from,
      iso_timestamp_end: resolvedParams.to,
    }))
    if (!datePickerValue.isHelper) {
      setTimeRange(resolvedParams.from, resolvedParams.to)
    } else {
      setTimeRange('', '')
    }
    setSearch(query)
    addRecentLogSqlSnippet({ sql: query })
  }

  const handleInsertSource = (source: string) => {
    if (editorRef.current && monaco) {
      const editorModel = editorRef.current?.getModel()
      const currentValue = editorRef.current.getValue()

      let updatedValue: string
      if (useOtelEndpoint) {
        const sourceFilter = /source\s*=\s*'[^']*'/i
        updatedValue = sourceFilter.test(currentValue)
          ? currentValue.replace(sourceFilter, `source = '${source}'`)
          : otelSourceQuery(source)
      } else {
        const index = currentValue.indexOf('from')
        updatedValue =
          index < 0
            ? `${currentValue}${source}`
            : `${currentValue.substring(0, index + 4)} ${source} ${currentValue.substring(index + 5)}`
      }

      editorRef.current.pushUndoStop()
      editorRef.current.executeEdits(`insert-identifier`, [
        {
          text: updatedValue,
          range: editorModel?.getFullModelRange() ?? new monaco.Range(1, 1, 1, 1),
        },
      ])
      editorRef.current.pushUndoStop()
      editorRef.current.focus()
    }
  }

  const handleCreateQuery = async (values: SaveQueryFormValues) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')

    const id = uuidv4()
    const payload: UpsertContentPayload = {
      id,
      name: values.name,
      description: values.description || '',
      type: 'log_sql' as const,
      content: {
        content_id: editorId,
        sql: editorValue,
        schema_version: '1',
        favorite: false,
      } as LogSqlSnippets.Content,
      owner_id: profile.id,
      visibility: 'user' as const,
    }
    await upsertContent(
      { projectRef, payload },
      {
        onSuccess: () => router.push(`/project/${projectRef}/logs/explorer?queryId=${id}`),
      }
    )
  }

  async function handleOnSave() {
    if (!projectRef) return console.error('Project ref is required')

    const currentSql = editorRef.current?.getValue() ?? editorValue

    // if we have a queryId, we are editing a saved query
    if (queryId && query) {
      await upsertContent({
        projectRef: projectRef!,
        payload: {
          ...query,
          content: { ...(query.content as LogSqlSnippets.Content), sql: currentSql },
        },
      })

      return
    }

    setSaveModalOpen(!saveModalOpen)
  }

  const handleDateChange = (value: DatePickerValue) => {
    setDatePickerValue(value)
    const resolvedRange = resolveLogDateRange(value)
    const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(
      resolvedRange.from,
      entitledToAuditLogDays
    )

    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
      return
    }

    if (value.isHelper) {
      setTimeRange('', '')
    } else {
      setTimeRange(resolvedRange.from || '', resolvedRange.to || '')
    }
    setSelectedLog(null)
    setParams((prev) => ({
      ...prev,
      iso_timestamp_start: resolvedRange.from,
      iso_timestamp_end: resolvedRange.to,
    }))
  }

  const querySql = (query?.content as LogSqlSnippets.Content | undefined)?.sql
  useEffect(() => {
    if (search) {
      setEditorValue(search)
    } else if (q && !queryId) {
      setEditorValue(q)
      setSearch(q)
    } else if (queryId && querySql) {
      setEditorValue(querySql)
      editorRef.current?.setValue(querySql)
    } else if (!queryId) {
      setEditorValue(PLACEHOLDER_QUERY)
      editorRef.current?.setValue(PLACEHOLDER_QUERY)
    }
  }, [q, search, queryId, querySql, setSearch, PLACEHOLDER_QUERY])

  useEffect(() => {
    // prevents overwriting when the user selects a helper.
    // without this, if the user selects "last 3 days" it would overwrite it with "last hour"
    // its the simplest solution I could come up with - jordi
    if (!initialDatePickerValue.isHelper) {
      setDatePickerValue(initialDatePickerValue)
    }
  }, [initialDatePickerValue])

  useEffect(() => {
    let newWarnings = []
    const start = timestampStart ? dayjs(timestampStart) : dayjs()
    const end = timestampEnd ? dayjs(timestampEnd) : dayjs()
    const daysDiff = Math.abs(start.diff(end, 'days'))

    if (daysDiff >= LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD) {
      newWarnings.push({
        text: 'Querying large date ranges can be slow. Consider selecting a smaller date range.',
      })
    }
    if (editorValue && !editorValue.toLowerCase().includes('limit')) {
      newWarnings.push({ text: 'When querying large date ranges, include a LIMIT clause.' })
    }
    setWarnings(newWarnings)
  }, [editorValue, timestampStart, timestampEnd])

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (timestampStart) {
      const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(
        timestampStart,
        entitledToAuditLogDays
      )
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(true)
      }
    }
  }, [timestampStart, entitledToAuditLogDays, setShowUpgradePrompt])

  return (
    <div className="w-full h-full mx-auto">
      <ResizablePanelGroup
        className="w-full h-full max-h-screen"
        orientation="vertical"
        autoSaveId={LOCAL_STORAGE_KEYS.LOG_EXPLORER_SPLIT_SIZE}
      >
        <ResizablePanel collapsible minSize="5">
          <LogsQueryPanel
            value={datePickerValue}
            onDateChange={handleDateChange}
            onSelectSource={handleInsertSource}
            templates={allTemplates.filter((template) => template.mode === 'custom')}
            onSelectTemplate={onSelectTemplate}
            warnings={warnings}
            showRewriteAction={showRewriteCTA && rewriteBannerDismissed}
            isRewriting={isRewriting}
            onRewrite={handleRewrite}
          />
          {showRewriteCTA && !rewriteBannerDismissed && (
            <LogsExplorerOtelBanner
              isRewriting={isRewriting}
              onRewrite={handleRewrite}
              onDismiss={() => setRewriteBannerDismissed(true)}
            />
          )}
          <ShimmerLine active={isLoading} />
          <div className="relative h-full">
            <CodeEditor
              // Ensure we reset the editor to the query content whenever the selected query changes
              key={queryId}
              id={editorId}
              editorRef={editorRef}
              language="pgsql"
              defaultValue={editorValue}
              onInputChange={(v) => setEditorValue(v || '')}
              actions={{ runQuery: { enabled: true, callback: handleRun } }}
            />
            {rewriteProposal && (
              <div className="absolute inset-0 z-10 flex flex-col bg-studio">
                <div className="flex items-center justify-between gap-2 border-b bg-surface-100 px-4 py-2">
                  <span className="text-xs text-foreground-light">
                    Review the ClickHouse SQL rewrite before accepting it
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="tiny" onClick={discardRewrite}>
                      Discard
                    </Button>
                    <Button variant="primary" size="tiny" onClick={acceptRewrite}>
                      Accept
                    </Button>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <DiffEditor
                    language="pgsql"
                    original={rewriteProposal.original}
                    modified={rewriteProposal.modified}
                    options={{ renderSideBySide: true, renderGutterMenu: false }}
                  />
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel collapsible minSize="5" className="overflow-auto">
          <LoadingOpacity active={isLoading}>
            <LogTable
              isSaving={isUpsertingContent}
              showHistogramToggle={false}
              onRun={handleRun}
              onSave={handleOnSave}
              hasEditorValue={Boolean(editorValue)}
              data={results}
              error={error}
              projectRef={projectRef}
              onSelectedLogChange={setSelectedLog}
              selectedLog={selectedLog || undefined}
              sqlQuery={editorValue}
            />

            <div className="flex flex-row justify-end mt-2">
              <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
            </div>
          </LoadingOpacity>
        </ResizablePanel>
      </ResizablePanelGroup>

      <UpdateSavedQueryModal
        header="Save log query"
        visible={saveModalOpen}
        initialValues={{ name: '', description: '' }}
        onCancel={() => {
          setSaveModalOpen(false)
        }}
        onSubmit={handleCreateQuery}
      />
    </div>
  )
}

LogsExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Explorer">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsExplorerPage
