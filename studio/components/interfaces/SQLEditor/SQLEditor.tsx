import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSqlEditMutation } from 'data/ai/sql-edit-mutation'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { motion } from 'framer-motion'
import { useLocalStorage, useStore } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import Split from 'react-split'
import { format } from 'sql-formatter'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, Button, IconCheck, IconCornerDownLeft, IconX, Input, cn } from 'ui'
import type { IStandaloneCodeEditor } from './MonacoEditor'
import { sqlAiDisclaimerComment } from './SQLEditor.constants'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

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

type ContentDiff = {
  original: string
  modified: string
}

const SQLEditor = () => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: editSql, isLoading: isEditSqlLoading } = useSqlEditMutation()
  const [aiInput, setAiInput] = useState('')
  const [sqlDiff, setSqlDiff] = useState<ContentDiff>()
  const inputRef = useRef<HTMLInputElement>(null)

  const isDiffOpen = !!sqlDiff

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
    if (isDiffOpen) {
      return
    }

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
  }, [isExecuting, isDiffOpen, execute, project])

  const acceptAiHandler = useCallback(() => {
    if (!sqlDiff) {
      return
    }

    // TODO: show error if undefined
    if (id && editorRef.current) {
      const editorModel = editorRef.current.getModel()

      if (!editorModel) {
        return
      }

      editorRef.current.executeEdits('apply-ai-edit', [
        {
          text: sqlDiff.modified,
          range: editorModel.getFullModelRange(),
        },
      ])

      setAiInput('')
      setSqlDiff(undefined)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [sqlDiff, id])

  const discardAiHandler = useCallback(() => {
    setSqlDiff(undefined)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDiffOpen) {
        return
      }

      switch (e.key) {
        case 'Enter':
          acceptAiHandler()
          return
        case 'Escape':
          discardAiHandler()
          return
      }
    }

    window.addEventListener('keydown', handler)

    return () => window.removeEventListener('keydown', handler)
  }, [isDiffOpen, acceptAiHandler, discardAiHandler])

  return (
    <div className="flex h-full flex-col">
      {!isEditSqlLoading ? (
        <motion.div
          key="ask-ai-input"
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
          className="w-full flex justify-center z-[1000] mt-0.5 bg-brand-400"
        >
          <Input
            autoFocus
            size="xlarge"
            value={aiInput}
            onChange={(e) => setAiInput(e.currentTarget.value)}
            disabled={isDiffOpen}
            inputRef={inputRef}
            icon={
              <motion.div
                key="ask-ai-input-icon"
                layoutId="ask-ai-input-icon"
                className="ml-1"
                initial={{
                  rotate: 0,
                }}
                animate={{
                  rotate: 0,
                }}
              >
                <AiIcon className="w-4 h-4" />
              </motion.div>
            }
            inputClassName="w-full !border-brand-900 border-none py-4 focus:!ring-0 placeholder:text-scale-900"
            iconContainerClassName="transition text-scale-800 text-brand-900"
            placeholder="Ask Supabase AI to modify your query"
            className="w-full"
            actions={
              <div className="flex flex-row items-center gap-2 space-x-1 mr-6">
                {isDiffOpen ? (
                  <>
                    <Button
                      type="primary"
                      size="tiny"
                      icon={<IconCheck />}
                      iconRight={
                        <div className="opacity-30">
                          <IconCornerDownLeft size={12} strokeWidth={1.5} />
                        </div>
                      }
                      onClick={acceptAiHandler}
                    >
                      Accept
                    </Button>
                    <Button
                      type="alternative"
                      size="tiny"
                      icon={<IconX />}
                      iconRight={<span className="opacity-30">ESC</span>}
                      onClick={discardAiHandler}
                    >
                      Discard
                    </Button>
                  </>
                ) : (
                  <IconCornerDownLeft size={16} strokeWidth={1.5} />
                )}
              </div>
            }
            onKeyPress={async (e) => {
              if (e.key === 'Enter') {
                try {
                  const prompt = e.currentTarget.value

                  console.log({ prompt })

                  if (!prompt) {
                    return
                  }

                  const sql = editorRef.current?.getValue()

                  if (!sql) {
                    return
                  }

                  const { sql: modifiedSql } = await editSql({
                    prompt,
                    sql: sql.replace(sqlAiDisclaimerComment, '').trim(),
                  })

                  const formattedSql =
                    sqlAiDisclaimerComment +
                    '\n\n' +
                    format(modifiedSql, {
                      language: 'postgresql',
                      keywordCase: 'lower',
                    })

                  // TODO: show error
                  if (formattedSql.trim() === sql.trim()) {
                    return
                  }

                  setSqlDiff({
                    original: sql,
                    modified: formattedSql,
                  })
                } catch (error: unknown) {
                  if (
                    error &&
                    typeof error === 'object' &&
                    'message' in error &&
                    typeof error.message === 'string'
                  ) {
                    ui.setNotification({
                      category: 'error',
                      message: error.message,
                    })
                  }
                }
              }
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="ask-ai-loading"
          layoutId="ask-ai-input"
          className="w-fit p-5 border border-brand-900 text-brand-900 self-center"
          initial={{
            borderRadius: 50,
          }}
          animate={{
            borderRadius: 50,
          }}
          transition={{
            type: 'spring',
            mass: 0.1,
            stiffness: 200,
            damping: 30,
          }}
        >
          <motion.div
            key="ask-ai-loading-icon"
            layoutId="ask-ai-input-icon"
            animate={{
              rotate: 360,
              transition: {
                delay: 0.2,
                ease: 'linear',
                duration: 2,
                repeat: Infinity,
              },
            }}
          >
            <AiIcon className="w-4 h-4" />
          </motion.div>
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
            <>
              {isDiffOpen && (
                <motion.div
                  key="diff-editor"
                  className="w-full h-full"
                  initial={{
                    opacity: 0,
                    filter: 'blur(10px)',
                  }}
                  animate={{
                    opacity: 1,
                    filter: 'blur(0px)',
                  }}
                >
                  <DiffEditor
                    theme="supabase"
                    language="pgsql"
                    original={sqlDiff.original}
                    modified={sqlDiff.modified}
                    options={{
                      fontSize: 13,
                    }}
                  />
                </motion.div>
              )}

              <motion.div
                key="monaco-editor"
                className={cn('w-full', 'h-full', isDiffOpen && 'invisible')}
              >
                <MonacoEditor
                  id={id}
                  editorRef={editorRef}
                  isExecuting={isExecuting}
                  autoFocus={false}
                  executeQuery={executeQuery}
                  // onOpenAiWidget={() => setIsAiWidgetOpen(true)}
                  // onCloseAiWidget={() => setIsAiWidgetOpen(false)}
                />
              </motion.div>
            </>
          )}
        </motion.div>
        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <UtilityPanel
              id={id}
              isExecuting={isExecuting}
              isDisabled={isDiffOpen}
              executeQuery={executeQuery}
            />
          )}
        </div>
      </Split>
    </div>
  )
}

export default SQLEditor
