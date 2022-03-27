import useSWR from 'swr'
import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import {
  Typography,
  IconLoader,
  IconAlertCircle,
  IconRewind,
  Button,
  IconInfo,
  Card,
  Input,
  IconPlay,
} from '@supabase/ui'

import { withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { SettingsLayout } from 'components/layouts/'
import CodeEditor from 'components/ui/CodeEditor'
import {
  LogPanel,
  LogTable,
  LogEventChart,
  Count,
  Logs,
  LogTemplate,
  TEMPLATES,
  LogData,
  LogSearchCallback,
  LOG_TYPE_LABEL_MAPPING,
  genDefaultQuery,
  genCountQuery,
  LogsTableName,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { isUndefined } from 'lodash'
import dayjs from 'dayjs'
import InformationBox from 'components/ui/InformationBox'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'
import ShimmerLine from 'components/ui/ShimmerLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'

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
  const [editorValue, setEditorValue] = useState<string>('')

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

  const EditorControls = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          type="default"
          onClick={() => {
            setEditorValue('')
            setEditorId(uuidv4())
          }}
        >
          Clear query
        </Button>
        <Button type="default" disabled>
          Save query
        </Button>
      </div>

      <Button
        type={editorValue ? 'alternative' : 'default'}
        disabled={!editorValue}
        onClick={handleEditorSubmit}
        icon={<IconPlay />}
      >
        Run
      </Button>
    </div>
  )

  return (
    <LogsExplorerLayout>
      <div className="h-full flex flex-col flex-grow gap-4">
        <div className="border rounded">
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
            editorControls={<EditorControls />}
          />

          <div className="min-h-[7rem] h-48">
            <ShimmerLine active={isLoading} />
            <CodeEditor
              id={editorId}
              language="pgsql"
              defaultValue={editorValue}
              onInputChange={(v) => setEditorValue(v || '')}
              onInputRun={handleEditorSubmit}
            />
          </div>
        </div>

        <div className="flex flex-col flex-grow relative pb-8">
          {/* <LogTable data={logData} isCustomQuery={true} /> */}

          <LoadingOpacity active={isLoading}>
            <div className="flex flex-grow h-full">
              <LogTable data={logData} isCustomQuery={true} />
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
