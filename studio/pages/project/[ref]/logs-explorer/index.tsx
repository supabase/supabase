import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography, IconAlertCircle, Card, Input, Alert } from '@supabase/ui'
import { withAuth } from 'hooks'
import CodeEditor from 'components/ui/CodeEditor'
import {
  LogsQueryPanel,
  LogsTableName,
  LogTable,
  LogTemplate,
  TEMPLATES,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { LogsExplorerLayout } from 'components/layouts'
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

  const handleInsertSource = (source: LogsTableName) => {
    setEditorValue((prev) => prev + source)
    setEditorId(uuidv4())
  }

  return (
    <LogsExplorerLayout>
      <div className="h-full flex flex-col flex-grow gap-4">
        <div className="border rounded">
          <LogsQueryPanel
            onSelectSource={handleInsertSource}
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
              <LogTable data={logData} error={error} />
            </div>
          </LoadingOpacity>
        </div>
      </div>
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
