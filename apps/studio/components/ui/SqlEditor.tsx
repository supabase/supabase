import Editor, { OnChange, useMonaco } from '@monaco-editor/react'
import { noop } from 'lodash'
import { useEffect, useRef } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { formatQuery } from 'data/sql/format-sql-query'

// [Joshen] We should deprecate this and use CodeEditor instead

interface SqlEditorProps {
  contextmenu?: boolean
  defaultValue?: string
  language?: string
  onInputChange?: OnChange
  queryId?: string
  readOnly?: boolean
}

/**
 * @deprecated Use CodeEditor instead
 */
const SqlEditor = ({
  queryId,
  language = 'pgsql',
  defaultValue = '',
  readOnly = false,
  contextmenu = true,
  onInputChange = noop,
}: SqlEditorProps) => {
  const monaco = useMonaco()
  const { project } = useProjectContext()
  const editorRef = useRef<any>()

  useEffect(() => {
    if (monaco) {
      // Enable pgsql format
      const formatprovider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
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
        formatprovider.dispose()
      }
    }
  }, [monaco])

  useEffect(() => {
    if (editorRef.current) {
      // add margin above first line
      editorRef.current?.changeViewZones((accessor: any) => {
        accessor.addZone({
          afterLineNumber: 0,
          heightInPx: 4,
          domNode: document.createElement('div'),
        })
      })
    }
  }, [queryId])

  async function formatPgsql(value: any) {
    try {
      const formatted = await formatQuery({
        projectRef: project?.ref!,
        connectionString: project?.connectionString,
        sql: value,
      })
      return formatted
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  const onMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Add margin above first line
    editor.changeViewZones((accessor: any) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })
  }

  const Loading = () => <h4 className="text-lg">Loading</h4>

  return (
    <Editor
      className="monaco-editor"
      theme="supabase"
      defaultLanguage={language}
      defaultValue={defaultValue}
      path={queryId}
      loading={<Loading />}
      options={{
        readOnly,
        tabSize: 2,
        fontSize: 13,
        minimap: {
          enabled: false,
        },
        wordWrap: 'on',
        fixedOverflowWidgets: true,
        contextmenu: contextmenu,
      }}
      onMount={onMount}
      onChange={onInputChange}
    />
  )
}

export default SqlEditor
