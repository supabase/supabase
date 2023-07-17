import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { motion } from 'framer-motion'
import { useLocalStorage } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
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

  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      {!isAiWidgetOpen && (
        <motion.div
          layoutId="ask-ai-input"
          initial={{
            scaleY: 1,
            y: 50,
            borderRadius: 0,
          }}
          animate={{
            scaleY: 1,
            y: 0,
            borderRadius: 0,
          }}
          className="w-full flex justify-center z-[1000] mt-0.5 border border-brand-900"
        >
          <Input
            autoFocus
            size="xlarge"
            icon={<AiIcon className="w-4 h-4 ml-1" />}
            inputClassName="w-full !border-brand-900 border-none py-4 focus:!ring-0"
            iconContainerClassName="transition text-scale-800 text-brand-900"
            placeholder="Ask Supabase AI to modify your query"
            className="w-full"
            actions={
              <div className="flex items-center space-x-1 mr-6">
                <IconCornerDownLeft size={16} strokeWidth={1.5} />
              </div>
            }
          />
        </motion.div>
      )}
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
        <motion.div
          layout="position"
          className="dark:border-dark flex-grow overflow-y-auto border-b"
          initial={{
            opacity: 0,
            filter: 'blur(10px)',
          }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
          }}
          transition={{
            duration: 0.3,
          }}
        >
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <MonacoEditor
              id={id}
              editorRef={editorRef}
              isExecuting={isExecuting}
              executeQuery={executeQuery}
              onOpenAiWidget={() => setIsAiWidgetOpen(true)}
              onCloseAiWidget={() => setIsAiWidgetOpen(false)}
            />
          )}
        </motion.div>
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
