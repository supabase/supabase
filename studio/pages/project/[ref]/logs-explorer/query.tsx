import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography, IconAlertCircle, Card, Input } from '@supabase/ui'
import { withAuth } from 'hooks'
import CodeEditor from 'components/ui/CodeEditor'
import { LogsQueryPanel, LogTable, LogTemplate, TEMPLATES } from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import {LogsExplorerLayout} from 'components/layouts'
import ShimmerLine from 'components/ui/ShimmerLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'

export const LogsExplorerPage: NextPage = () => {
  const router = useRouter()
  const { ref, q } = router.query
  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState<string>('')

  const [{ logData, error, isLoading }, { changeQuery, runQuery }] = useLogsQuery(ref as string)
  useEffect(() => {
    // on mount, set initial values
    if (q !== undefined && q !== '') {
      changeQuery(q as string)
      runQuery()
      onSelectTemplate({
        mode: 'custom',
        searchString: q as string,
      })
    }
  }, [q])

  const onSelectTemplate = (template: LogTemplate) => {
    setEditorValue(template.searchString)
    changeQuery(template.searchString)
    setEditorId(uuidv4())
    runQuery()
  }

  const handleRun = () => {
    changeQuery(editorValue)
    runQuery()
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: editorValue },
    })
  }

  const handleClear = () => {
    setEditorValue('')
    setEditorId(uuidv4())
    changeQuery('')
  }
  return (
    <LogsExplorerLayout>
      <div className="h-full flex flex-col flex-grow gap-4">
        <div className="border rounded">
          <LogsQueryPanel
            onClear={handleClear}
            onRun={handleRun}
            hasEditorValue={Boolean(editorValue)}
            templates={TEMPLATES.filter((template) => template.mode === 'custom')}
            onSelectTemplate={onSelectTemplate}
          />

          <div className="min-h-[7rem] h-48">
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

        <div className="flex flex-col flex-grow relative pb-8">
          <LoadingOpacity active={isLoading}>
            <div className="flex flex-grow h-full">
              <LogTable data={logData} />
            </div>
          </LoadingOpacity>

          {error && (
            <div className="flex w-full h-full justify-center items-center mx-auto">
              <Card className="flex flex-col gap-y-2  w-2/5 bg-scale-400">
                <div className="flex flex-row gap-x-2 py-2">
                  <IconAlertCircle size={16} />
                  <Typography.Text type="secondary">
                    Sorry! An error occured when fetching data.
                  </Typography.Text>
                </div>
                <Input.TextArea
                  label="Error Messages"
                  value={JSON.stringify(error, null, 2)}
                  borderless
                  className=" border-t-2 border-scale-800 pt-2 font-mono"
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
