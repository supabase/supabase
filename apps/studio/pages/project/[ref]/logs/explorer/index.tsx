import { useMonaco } from '@monaco-editor/react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
  LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD,
  TEMPLATES,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { LogData, LogsWarning, LogTemplate } from 'components/interfaces/Settings/Logs/Logs.types'
import {
  maybeShowUpgradePromptIfNotEntitled,
  useEditorHints,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import {
  buildLogQueryParams,
  resolveLogDateRange,
} from 'components/interfaces/Settings/Logs/logsDateRange'
import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'
import { LogTable } from 'components/interfaces/Settings/Logs/LogTable'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useContentQuery } from 'data/content/content-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from 'data/content/content-upsert-mutation'
import dayjs from 'dayjs'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useTrack } from 'lib/telemetry/track'
import type { editor } from 'monaco-editor'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { LogSqlSnippets, NextPageWithLayout } from 'types'
import {
  Button,
  Form,
  Input,
  Modal,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from 'ui'

const LOCAL_PLACEHOLDER_QUERY =
  'select\n  timestamp, event_message, metadata\n  from edge_logs limit 5'

const PLATFORM_PLACEHOLDER_QUERY =
  'select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nlimit 5'

export const LogsExplorerPage: NextPageWithLayout = () => {
  useEditorHints()
  const monaco = useMonaco()
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, q, queryId } = useParams()
  const track = useTrack()
  const projectRef = ref as string
  const { logsShowMetadataIpTemplate } = useIsFeatureEnabled(['logs:show_metadata_ip_template'])

  const allTemplates = useMemo(() => {
    if (logsShowMetadataIpTemplate) return TEMPLATES
    else return TEMPLATES.filter((x) => x.label !== 'Metadata IP')
  }, [logsShowMetadataIpTemplate])

  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const [editorId] = useState<string>(uuidv4())
  const { timestampStart, timestampEnd, setTimeRange } = useLogsUrlState()
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
  const PLACEHOLDER_QUERY = IS_PLATFORM
    ? logsDefaultQuery ?? PLATFORM_PLACEHOLDER_QUERY
    : LOCAL_PLACEHOLDER_QUERY

  const [editorValue, setEditorValue] = useState<string>(PLACEHOLDER_QUERY)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false)
  const [warnings, setWarnings] = useState<LogsWarning[]>([])
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null)

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
    true
  )

  const results = logData
  const isLoading = logsLoading

  const { mutate: upsertContent, isPending: isUpsertingContent } = useContentUpsertMutation({
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

  const handleRun = (value?: string | React.MouseEvent<HTMLButtonElement>) => {
    track('log_explorer_query_run_button_clicked', { is_saved_query: !!queryId })

    const query = typeof value === 'string' ? value || editorValue : editorValue
    const resolvedParams = buildLogQueryParams(datePickerValue, query)

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
    const queryParams: Record<string, string | string[] | undefined> = { ...router.query, q: query }
    if (datePickerValue.isHelper) {
      delete queryParams.its
      delete queryParams.ite
    }
    router.push({
      pathname: router.pathname,
      query: queryParams,
    })
    addRecentLogSqlSnippet({ sql: query })
  }

  const handleInsertSource = (source: string) => {
    if (editorRef.current && monaco) {
      const editorModel = editorRef.current?.getModel()
      const currentValue = editorRef.current.getValue()
      const index = currentValue.indexOf('from')

      const updatedValue =
        index < 0
          ? `${currentValue}${source}`
          : `${currentValue.substring(0, index + 4)} ${source} ${currentValue.substring(index + 5)}`

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

  type SaveQueryFormValues = { name: string; description?: string }

  const handleCreateQuery = async (
    values: SaveQueryFormValues,
    { setSubmitting }: { setSubmitting: (value: boolean) => void }
  ) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')
    setSubmitting(true)

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
    upsertContent(
      { projectRef, payload },
      {
        onSuccess: () => router.push(`/project/${projectRef}/logs/explorer?queryId=${id}`),
      }
    )
  }

  function handleOnSave() {
    if (!projectRef) return console.error('Project ref is required')

    // if we have a queryId, we are editing a saved query
    if (queryId && query) {
      upsertContent({
        projectRef: projectRef!,
        payload: {
          ...query,
          content: { ...(query.content as LogSqlSnippets.Content), sql: editorValue },
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
    setParams((prev) => ({
      ...prev,
      iso_timestamp_start: resolvedRange.from,
      iso_timestamp_end: resolvedRange.to,
    }))
  }

  useEffect(() => {
    if (q) {
      setEditorValue(q)
    }
  }, [q])

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
        direction="vertical"
        autoSaveId={LOCAL_STORAGE_KEYS.LOG_EXPLORER_SPLIT_SIZE}
      >
        <ResizablePanel collapsible minSize={5}>
          <LogsQueryPanel
            value={datePickerValue}
            onDateChange={handleDateChange}
            onSelectSource={handleInsertSource}
            templates={allTemplates.filter((template) => template.mode === 'custom')}
            onSelectTemplate={onSelectTemplate}
            warnings={warnings}
          />
          <ShimmerLine active={isLoading} />
          <CodeEditor
            id={editorId}
            editorRef={editorRef}
            language="pgsql"
            defaultValue={editorValue}
            onInputChange={(v) => setEditorValue(v || '')}
            actions={{ runQuery: { enabled: true, callback: handleRun } }}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel collapsible minSize={5} className="overflow-auto">
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
            />

            <div className="flex flex-row justify-end mt-2">
              <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
            </div>
          </LoadingOpacity>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Modal
        size="medium"
        onCancel={() => setSaveModalOpen(!saveModalOpen)}
        header="Save log query"
        visible={saveModalOpen}
        hideFooter
      >
        <Form
          initialValues={{
            name: '',
            description: '',
          }}
          onSubmit={handleCreateQuery}
        >
          {() => (
            <>
              <Modal.Content className="space-y-6">
                <Input layout="horizontal" label="Name" id="name" />
                <div className="text-area-text-sm">
                  <Input.TextArea
                    layout="horizontal"
                    labelOptional="Optional"
                    label="Description"
                    id="description"
                    rows={2}
                  />
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content className="flex items-center justify-end gap-2">
                <Button size="tiny" type="default" onClick={() => setSaveModalOpen(!saveModalOpen)}>
                  Cancel
                </Button>
                <Button
                  size="tiny"
                  loading={isUpsertingContent}
                  disabled={isUpsertingContent}
                  htmlType="submit"
                >
                  Save
                </Button>
              </Modal.Content>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

LogsExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsExplorerPage
