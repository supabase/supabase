import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { MutableRefObject, useRef } from 'react'
import { cn } from 'ui'

import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useSelectedProject } from 'hooks'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { untitledSnippetTitle } from './SQLEditor.constants'
import { IStandaloneCodeEditor } from './SQLEditor.types'
import { createSqlSnippetSkeleton } from './SQLEditor.utils'

export type MonacoEditorProps = {
  id: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  autoFocus?: boolean
  executeQuery: () => void
  className?: string
}

const MonacoEditor = ({
  id,
  editorRef,
  autoFocus = true,
  className,
  executeQuery,
}: MonacoEditorProps) => {
  const { ref, content } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()

  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const monacoRef = useRef<Monaco | null>(null)
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const model = editorRef.current.getModel()
    if (model !== null) {
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
    }

    editor.addAction({
      id: 'run-query',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        executeQueryRef.current()
      },
    })

    // add margin above first line
    editorRef.current.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    if (autoFocus) {
      if (editor.getValue().length === 1) editor.setPosition({ lineNumber: 1, column: 2 })
      editor.focus()
    }
  }

  function handleEditorChange(value: string | undefined) {
    if (id && value) {
      if (snap.snippets[id]) {
        snap.setSql(id, value)
      } else {
        const snippet = createSqlSnippetSkeleton({
          id,
          name: untitledSnippetTitle,
          sql: value,
          owner_id: profile?.id,
          project_id: project?.id,
        })
        if (ref) {
          snap.addSnippet(snippet as SqlSnippet, ref)
          snap.addNeedsSaving(snippet.id!)
          router.push(`/project/${ref}/sql/${snippet.id}`, undefined, { shallow: true })
        }
      }
    }
  }

  return (
    <Editor
      className={cn(className, 'monaco-editor')}
      theme={'supabase'}
      onMount={handleEditorOnMount}
      onChange={handleEditorChange}
      defaultLanguage="pgsql"
      defaultValue={snippet?.snippet.content.sql ?? content}
      path={id}
      options={{
        tabSize: 2,
        fontSize: 13,
        minimap: { enabled: false },
        wordWrap: 'on',
        // [Joshen] Commenting the following out as it causes the autocomplete suggestion popover
        // to be positioned wrongly somehow. I'm not sure if this affects anything though, but leaving
        // comment just in case anyone might be wondering. Relevant issues:
        // - https://github.com/microsoft/monaco-editor/issues/2229
        // - https://github.com/microsoft/monaco-editor/issues/2503
        // fixedOverflowWidgets: true,
      }}
    />
  )
}

export default MonacoEditor
