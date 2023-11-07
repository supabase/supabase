import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal } from 'ui'

import { useParams } from 'common/hooks'
import {
  DatePickerToFrom,
  LogsQueryPanel,
  LogsTableName,
  LogsWarning,
  LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD,
  LogTable,
  LogTemplate,
  maybeShowUpgradePrompt,
  TEMPLATES,
  useEditorHints,
} from 'components/interfaces/Settings/Logs'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import { LogsLayout } from 'components/layouts'
import CodeEditor from 'components/ui/CodeEditor'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useContentInsertMutation } from 'data/content/content-insert-mutation'
import { useLocalStorage, useSelectedOrganization, useStore } from 'hooks'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { uuidv4 } from 'lib/helpers'
import { LogSqlSnippets, NextPageWithLayout } from 'types'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

const PLACEHOLDER_QUERY =
  'select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nlimit 5'
export const LogsExplorerPage: NextPageWithLayout = () => {
  useEditorHints()
  const { ui } = useStore()
  const router = useRouter()
  const { ref: projectRef, q, ite, its } = useParams()
  const organization = useSelectedOrganization()
  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState<string>(PLACEHOLDER_QUERY)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false)
  const [warnings, setWarnings] = useState<LogsWarning[]>([])
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { params, logData, error, isLoading, changeQuery, runQuery, setParams } = useLogsQuery(
    projectRef as string,
    {
      iso_timestamp_start: its ? (its as string) : undefined,
      iso_timestamp_end: ite ? (ite as string) : undefined,
    }
  )
  const [recentLogs, setRecentLogs] = useLocalStorage<LogSqlSnippets.Content[]>(
    `project-content-${projectRef}-recent-log-sql`,
    []
  )
  const addRecentLogSqlSnippet = (snippet: Partial<LogSqlSnippets.Content>) => {
    const defaults: LogSqlSnippets.Content = {
      schema_version: '1',
      favorite: false,
      sql: '',
      content_id: '',
    }
    setRecentLogs([...recentLogs, { ...defaults, ...snippet }])
  }

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(
    params.iso_timestamp_start as string
  )

  useEffect(() => {
    // on mount, set initial values
    if (q) {
      onSelectTemplate({
        mode: 'custom',
        searchString: q as string,
      })
    }
  }, [])

  useEffect(() => {
    let newWarnings = []
    const start = params.iso_timestamp_start ? dayjs(params.iso_timestamp_start) : dayjs()
    const end = params.iso_timestamp_end ? dayjs(params.iso_timestamp_end) : dayjs()
    const daysDiff = Math.abs(start.diff(end, 'days'))
    if (
      editorValue &&
      !editorValue.includes('limit') &&
      daysDiff > LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD
    ) {
      newWarnings.push({ text: 'When querying large date ranges, include a LIMIT clause.' })
    }
    setWarnings(newWarnings)
  }, [editorValue, params.iso_timestamp_start, params.iso_timestamp_end])

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (its) {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(its as string, subscription?.plan?.id)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [its, subscription])

  const onSelectTemplate = (template: LogTemplate) => {
    setEditorValue(template.searchString)
    changeQuery(template.searchString)
    setEditorId(uuidv4())
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: template.searchString },
    })
    addRecentLogSqlSnippet({ sql: template.searchString })
  }

  const handleRun = (value?: string | React.MouseEvent<HTMLButtonElement>) => {
    const query = typeof value === 'string' ? value || editorValue : editorValue
    if (value && typeof value === 'string') {
      setEditorValue(value)
    }
    changeQuery(query)
    runQuery()
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: query },
    })
    addRecentLogSqlSnippet({ sql: query })
  }

  const handleClear = () => {
    setEditorValue('')
    setEditorId(uuidv4())
    changeQuery('')
  }

  const handleInsertSource = (source: LogsTableName) => {
    setEditorValue((prev) => prev + source)
    setEditorId(uuidv4())
  }

  function handleOnSave() {
    setSaveModalOpen(!saveModalOpen)
  }

  const handleDateChange = ({ to, from }: DatePickerToFrom) => {
    const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, subscription?.plan?.id)

    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(!showUpgradePrompt)
    } else {
      setParams((prev) => ({
        ...prev,
        iso_timestamp_start: from || '',
        iso_timestamp_end: to || '',
      }))
      router.push({
        pathname: router.pathname,
        query: { ...router.query, its: from || '', ite: to || '' },
      })
    }
  }

  const { isLoading: isSubmitting, mutate: createContent } = useContentInsertMutation({
    onError: (e) => {
      const error = e as { message: string }
      console.error(error)
      setSaveModalOpen(false)
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to save query: ${error.message}`,
      })
    },
    onSuccess: (values) => {
      setSaveModalOpen(false)
      ui.setNotification({
        category: 'success',
        message: `Saved "${values[0].name}" log query`,
      })
    },
  })

  return (
    <div className="w-full h-full px-5 py-6 mx-auto">
      <LogsExplorerHeader />

      <div className="flex flex-col flex-grow h-full gap-4">
        <div className="border rounded">
          <LogsQueryPanel
            defaultFrom={params.iso_timestamp_start || ''}
            defaultTo={params.iso_timestamp_end || ''}
            onDateChange={handleDateChange}
            onSelectSource={handleInsertSource}
            onClear={handleClear}
            onRun={handleRun}
            hasEditorValue={Boolean(editorValue)}
            templates={TEMPLATES.filter((template) => template.mode === 'custom')}
            onSelectTemplate={onSelectTemplate}
            onSave={handleOnSave}
            isLoading={isLoading}
            warnings={warnings}
          />
          <div className="h-48 min-h-[7rem]">
            <ShimmerLine active={isLoading} />
            <CodeEditor
              id={editorId}
              language="pgsql"
              defaultValue={editorValue}
              onInputChange={(v) => setEditorValue(v || '')}
              onInputRun={handleRun}
            />
          </div>
        </div>
        <div className="relative flex flex-col flex-grow">
          <LoadingOpacity active={isLoading}>
            <div className="flex flex-grow h-full">
              <LogTable
                params={params}
                data={logData}
                error={error}
                projectRef={projectRef as string}
              />
            </div>
          </LoadingOpacity>
          <div className="flex flex-row justify-end mt-2">
            <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
          </div>
        </div>
      </div>
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
            desdcription: '',
          }}
          onSubmit={async (values: any, { setSubmitting }: any) => {
            setSubmitting(true)

            const payload = {
              id: uuidv4(),
              name: values.name,
              description: values.description || '',
              type: 'log_sql' as const,
              content: {
                content_id: editorId,
                sql: editorValue,
                schema_version: '1',
                favorite: false,
              },
              visibility: 'user' as const,
            }

            createContent({ projectRef: projectRef!, payload })
          }}
        >
          {() => (
            <>
              <div className="py-4">
                <Modal.Content>
                  <div className="space-y-6">
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
                  </div>
                </Modal.Content>
              </div>
              <div className="py-3 border-t bg-surface-100">
                <Modal.Content>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => setSaveModalOpen(!saveModalOpen)}
                    >
                      Cancel
                    </Button>
                    <Button size="tiny" loading={isSubmitting} htmlType="submit">
                      Save
                    </Button>
                  </div>
                </Modal.Content>
              </div>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

LogsExplorerPage.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(LogsExplorerPage)
