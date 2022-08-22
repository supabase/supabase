import { FC, useEffect, useState, useRef } from 'react'
import Split from 'react-split'
import { observer } from 'mobx-react-lite'
import { CSVLink } from 'react-csv'
import { useMonaco } from '@monaco-editor/react'
import { IconLoader, Typography } from '@supabase/ui'

import { copyToClipboard, uuidv4 } from 'lib/helpers'
import { useStore } from 'hooks'
import { SQL_TEMPLATES } from './SQLEditor.constants'
import { getResultsMarkdown } from './SQLEditor.utils'
import { find, isUndefined } from 'lodash'

import Toolbar from './Toolbar'
import ResultsPane from './ResultsPane'
import CodeEditor from 'components/ui/CodeEditor'

const MIN_SPLIT_SIZE = 44
const SNAP_OFFSET = 50

// [Nice to have]: Implement AbortController to stop long running queries

interface Props {
  queryId?: string
  templateId?: number
}

const SQLEditor: FC<Props> = ({ queryId, templateId }) => {
  const csvRef = useRef(null)

  const [id, setId] = useState<string>(uuidv4())
  const [sizes, setSizes] = useState<number[]>([50, 50])
  const [results, setResults] = useState<any>(undefined)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  const [error, setError] = useState<any>(undefined)
  const [query, setQuery] = useState<string>('')

  const { meta, ui, content } = useStore()
  const queries = content.sqlSnippets()
  const monaco = useMonaco()

  useEffect(() => {
    if (queryId) {
      const query = find(queries, (query: any) => query.id === queryId)
      if (!isUndefined(query)) setSQLQuery(query.content.sql)
    }
  }, [queryId])

  useEffect(() => {
    if (templateId) {
      const template = find(SQL_TEMPLATES, { id: templateId })
      if (!isUndefined(template)) setSQLQuery(template.sql)
    }
  }, [templateId])

  useEffect(() => {
    if (monaco) {
      // Enable format provider for pgsql
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsql(value)
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ]
        },
      })
      return () => {
        formatProvider.dispose()
      }
    }
  }, [monaco])

  async function formatPgsql(value: string) {
    try {
      const formatted = await meta.formatQuery(value)
      if (formatted.error) throw formatted.error
      return formatted
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  const setSQLQuery = (query: string) => {
    setId(uuidv4())
    setQuery(query)
  }

  const runQuery = async (q: string) => {
    setIsRunning(true)
    setResults(null)
    setError(null)
    const response = await meta.query(q)
    if (response.error) {
      setError(response.error)
    } else {
      setResults(response)
    }
    setIsRunning(false)
  }

  const onSelectCopy = () => {
    if (!results || results.length === 0) {
      return ui.setNotification({ category: 'info', message: 'There are no results to be copied' })
    }
    const markdown = getResultsMarkdown(results)
    copyToClipboard(markdown, () => {
      ui.setNotification({ category: 'success', message: 'Results copied to clipboard' })
    })
  }

  const onSelectDownload = () => {
    if (!results || results.length === 0) {
      return ui.setNotification({
        category: 'info',
        message: 'There are no results to be downloaded',
      })
    }
    ;(csvRef.current as any)?.link.click()
  }

  const onSelectFavourite = () => {
    // console.log('Favourite query')
  }

  return (
    <div className="flex flex-col h-full">
      <Split
        className="h-full"
        direction="vertical"
        gutterSize={3}
        sizes={sizes}
        minSize={MIN_SPLIT_SIZE}
        snapOffset={SNAP_OFFSET}
        expandToMin={true}
        onDragEnd={setSizes}
      >
        <CodeEditor
          id={id}
          language="pgsql"
          defaultValue={query}
          onInputChange={(value?: string) => setQuery(value || '')}
          onInputRun={runQuery}
        />
        <div className="flex flex-col">
          <Toolbar
            isRunning={isRunning}
            runQuery={() => runQuery(query)}
            onSelectCopy={onSelectCopy}
            onSelectDownload={onSelectDownload}
            onSelectFavourite={onSelectFavourite}
          />
          <CSVLink
            ref={csvRef}
            className="hidden"
            data={results || []}
            filename={`supabase_${ui.selectedProject?.ref}_query`}
          />
          {isRunning ? (
            <div className="p-5 flex items-center space-x-4 bg-gray-100 dark:bg-gray-700">
              <IconLoader className="animate-spin" size={14} strokeWidth={2} />
              <Typography.Text>Running query</Typography.Text>
            </div>
          ) : (
            <>
              {results ? (
                <ResultsPane results={results} />
              ) : error ? (
                <div className="p-5 flex flex-col space-y-1">
                  <Typography.Text>The following error has occured:</Typography.Text>
                  <Typography.Text type="danger">{error.message}</Typography.Text>
                </div>
              ) : (
                <div className="p-5 flex items-center space-x-1 bg-table-header-light dark:bg-table-header-dark">
                  <Typography.Text>Click</Typography.Text>
                  <Typography.Text code small>
                    RUN
                  </Typography.Text>
                  <Typography.Text>to execute your query</Typography.Text>
                </div>
              )}
            </>
          )}
        </div>
      </Split>
    </div>
  )
}

export default observer(SQLEditor)
