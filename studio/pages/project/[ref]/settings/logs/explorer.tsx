import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography, IconLoader, IconAlertCircle, Button, Card, Input } from '@supabase/ui'

import { withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts/'
import CodeEditor from 'components/ui/CodeEditor'
import { LogPanel, LogTable, LogTemplate, TEMPLATES } from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import dayjs from 'dayjs'
import useLogsQuery from 'hooks/analytics/useLogsQuery'

/**
 * Acts as a container component for the entire log display
 *
 * ## Query Params Syncing
 * Query params are synced on query submission.
 *
 * params used are:
 * - `q` for the editor query.
 * - `s` for search query.
 * - `te` for timestamp start value.
 */
export const LogsExplorerPage: NextPage = () => {
  const router = useRouter()
  const { ref, type, q } = router.query
  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState('')
  const title = `Logs - All`
  const [{ logData, params, error, isLoading }, { changeQuery, runQuery }] = useLogsQuery(
    ref as string
  )
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

  const handleEditorSubmit = () => {
    changeQuery(editorValue)
    runQuery()
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: editorValue },
    })
  }

  return (
    <SettingsLayout title={title}>
      <div className="h-full flex flex-col flex-grow">
        <LogPanel
          isShowingEventChart={false}
          onToggleEventChart={() => null}
          isCustomQuery={true}
          isLoading={isLoading}
          newCount={0}
          templates={TEMPLATES.filter((template) => template.mode === 'custom')}
          onRefresh={() => null}
          onSearch={() => null}
          defaultSearchValue={''}
          defaultToValue={
            params.timestamp_end
              ? dayjs(Number(params.timestamp_end) / 1000).toISOString()
              : params.timestamp_end
          }
          onCustomClick={() => null}
          onSelectTemplate={onSelectTemplate}
        />
        <React.Fragment>
          <div className="min-h-[7rem] h-28">
            <CodeEditor
              id={editorId}
              language="pgsql"
              defaultValue={editorValue}
              onInputChange={(v) => setEditorValue(v || '')}
              onInputRun={handleEditorSubmit}
            />
          </div>
          <div className="flex flex-row justify-end items-center px-2 py-1 w-full">
            <div className="flex flex-row gap-x-2 justify-end p-2">
              <Button
                type="text"
                onClick={() => {
                  setEditorValue('')
                  setEditorId(uuidv4())
                }}
              >
                Reset
              </Button>
              <Button type={editorValue ? 'secondary' : 'text'} onClick={handleEditorSubmit}>
                Run
              </Button>
            </div>
          </div>
        </React.Fragment>
        <div className="flex flex-col flex-grow relative">
          {isLoading && (
            <div
              className={[
                'absolute top-0 w-full h-full flex items-center justify-center',
                'bg-gray-100 opacity-75 z-50',
              ].join(' ')}
            >
              <IconLoader className="animate-spin" />
            </div>
          )}

          <LogTable data={logData} />

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
    </SettingsLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
