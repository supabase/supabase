import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useLocalStorage } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import { detectOS } from 'lib/helpers'
import dynamic from 'next/dynamic'
import { useCallback, useRef } from 'react'
import Split from 'react-split'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, IconCornerDownLeft, Input } from 'ui'
import type { IStandaloneCodeEditor } from './MonacoEditor'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })

const OptionIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 5H7.76472L16.2353 19H21M16.2353 5H21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SQLEditor = () => {
  const { ref, id } = useParams()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()

  const [savedSplitSize, setSavedSplitSize] = useLocalStorage(
    'supabase_sql-editor-split-size',
    `[50, 50]`
  )

  const splitSize = savedSplitSize ? JSON.parse(savedSplitSize) : undefined

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) snap.addResult(id, data.result)
    },
    onError(error) {
      if (id) snap.addResultError(id, error)
    },
  })

  const idRef = useLatest(id)

  const minSize = 44
  const snippet = id ? snap.snippets[id] : null
  const snapOffset = 50

  const isLoading = !(id && ref && snap.loaded[ref])
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  const onDragEnd = useCallback((sizes: number[]) => {
    const id = idRef.current
    if (id) snap.setSplitSizes(id, sizes)
    setSavedSplitSize(JSON.stringify(sizes))
  }, [])

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)

  const executeQuery = useCallback(() => {
    // use the latest state
    const state = getSqlEditorStateSnapshot()
    const snippet = idRef.current && state.snippets[idRef.current]

    if (project && snippet && !isExecuting && editorRef.current !== null) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
      const overrideSql = selectedValue || editorRef.current?.getValue()

      execute({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: overrideSql ?? snippet.snippet.content.sql,
      })
    }
  }, [isExecuting, project])

  const os = detectOS()

  return (
    <div className="flex h-full flex-col">
      <Input
        size="xlarge"
        icon={<AiIcon className="w-4 h-4 ml-1" />}
        inputClassName="bg-transparent rounded-none focus:border-brand-900"
        iconContainerClassName="transition text-scale-800 peer-focus/input:text-brand-900"
        placeholder="Ask Supabase AI to do something"
        actions={
          <div className="flex items-center space-x-1 mr-6">
            {os === 'macos' ? <OptionIcon /> : <p className="text-xs text-scale-1100">ALT</p>}
            <IconCornerDownLeft size={16} strokeWidth={1.5} />
          </div>
        }
      />
      <Split
        style={{ height: '100%' }}
        direction="vertical"
        gutterSize={2}
        sizes={(splitSize ? splitSize : (snippet?.splitSizes as number[] | undefined)) ?? [50, 50]}
        minSize={minSize}
        snapOffset={snapOffset}
        expandToMin={true}
        collapsed={isUtilityPanelCollapsed ? 1 : undefined}
        onDragEnd={onDragEnd}
      >
        <div className="dark:border-dark flex-grow overflow-y-auto border-b">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <MonacoEditor
              id={id}
              editorRef={editorRef}
              isExecuting={isExecuting}
              executeQuery={executeQuery}
            />
          )}
        </div>
        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <UtilityPanel id={id} isExecuting={isExecuting} executeQuery={executeQuery} />
          )}
        </div>
      </Split>
    </div>
  )
}

export default SQLEditor
