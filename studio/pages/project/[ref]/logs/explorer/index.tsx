import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Input, Modal, Form, Button } from 'ui'

import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { NextPageWithLayout, UserContent } from 'types'
import { uuidv4 } from 'lib/helpers'
import { LogsLayout } from 'components/layouts'
import CodeEditor from 'components/ui/CodeEditor'
import ShimmerLine from 'components/ui/ShimmerLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'
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
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const PLACEHOLDER_QUERY =
  'select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nlimit 5'
export const LogsExplorerPage: NextPageWithLayout = () => {
  useEditorHints()
  const { ui, content } = useStore()
  const router = useRouter()
  const { ref: projectRef, q, ite, its } = useParams()
  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState<string>(PLACEHOLDER_QUERY)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false)
  const [warnings, setWarnings] = useState<LogsWarning[]>([])
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { params, logData, error, isLoading, changeQuery, runQuery, setParams } = useLogsQuery(
    projectRef as string,
    {
      iso_timestamp_start: its ? (its as string) : undefined,
      iso_timestamp_end: ite ? (ite as string) : undefined,
    }
  )

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
    content.addRecentLogSqlSnippet({
      sql: template.searchString,
    })
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
    content.addRecentLogSqlSnippet({
      sql: query,
    })
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

            const payload: UserContent = {
              name: values.name,
              description: values.description || '',
              type: 'log_sql',
              content: {
                content_id: editorId,
                sql: editorValue,
                schema_version: '1',
                favorite: false,
              },
              visibility: 'user',
            }

            try {
              const { data: query, error } = await content.create(payload)
              if (error) throw error
              setSubmitting(false)
              setSaveModalOpen(false)
              ui.setNotification({
                category: 'success',
                message: `Saved "${values.name}" log query`,
              })
            } catch (error: any) {
              console.error(error)
              setSubmitting(false)
              setSaveModalOpen(false)
              ui.setNotification({
                error,
                category: 'error',
                message: `Failed to save query: ${error.message}`,
              })
            }
          }}
        >
          {({ isSubmitting }: any) => (
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
              <div className="py-3 border-t bg-scale-300">
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
