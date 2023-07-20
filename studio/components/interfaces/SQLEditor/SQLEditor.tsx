import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSqlEditMutation } from 'data/ai/sql-edit-mutation'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { AnimatePresence, m } from 'framer-motion'
import { useLocalStorage, useStore } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import dynamic from 'next/dynamic'
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Split from 'react-split'
import { format } from 'sql-formatter'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, Button, IconCheck, IconCornerDownLeft, IconX, Input } from 'ui'
import type { IStandaloneCodeEditor } from './MonacoEditor'
import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

type ContentDiff = {
  original: string
  modified: string
}

type SQLEditorContextValues = {
  aiInput: string
  setAiInput: Dispatch<SetStateAction<string>>
  sqlDiff?: ContentDiff
  setSqlDiff: Dispatch<SetStateAction<ContentDiff | undefined>>
  debugSolution?: string
  setDebugSolution: Dispatch<SetStateAction<string | undefined>>
}

const SQLEditorContext = createContext<SQLEditorContextValues | undefined>(undefined)

export function useSqlEditor() {
  const values = useContext(SQLEditorContext)

  if (!values) {
    throw new Error('No SQL editor context. Are you using useSqlEditor() outside of SQLEditor?')
  }

  return values
}

const SQLEditor = () => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: editSql, isLoading: isEditSqlLoading } = useSqlEditMutation()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const [aiInput, setAiInput] = useState('')
  const [debugSolution, setDebugSolution] = useState<string>()
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

  /**
   * Sets the snippet title using AI if it is still untitled.
   */
  const setAiTitle = useCallback(async () => {
    if (
      id &&
      snippet &&
      snippet.snippet.name === untitledSnippetTitle &&
      !!snippet.snippet.content.sql
    ) {
      const { title } = await generateSqlTitle({ sql: snippet.snippet.content.sql })

      snap.renameSnippet(id, title)
    }
  }, [id, snippet, generateSqlTitle, snap])

  const executeQuery = useCallback(async () => {
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

      setAiTitle()

      execute({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: overrideSql ?? snippet.snippet.content.sql,
      })
    }
  }, [isExecuting, isDiffOpen, execute, project, setAiTitle])

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
      setDebugSolution(undefined)
      setSqlDiff(undefined)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [sqlDiff, id])

  const discardAiHandler = useCallback(() => {
    setDebugSolution(undefined)
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
    <SQLEditorContext.Provider
      value={{
        aiInput,
        setAiInput,
        sqlDiff,
        setSqlDiff,
        debugSolution,
        setDebugSolution,
      }}
    >
      <div className="flex h-full flex-col">
        <m.div
          key="ask-ai-input-container"
          layoutId="ask-ai-input-container"
          variants={{
            visible: {
              borderRadius: 0,
            },
          }}
          initial="visible"
          animate="visible"
          className="w-full flex justify-center z-10 mt-0.5 bg-brand-400"
        >
          <AnimatePresence initial={false} exitBeforeEnter>
            {!isEditSqlLoading ? (
              <m.div
                key="ask-ai-input"
                className="w-full"
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                  },
                  hidden: {
                    opacity: 0,
                    y: -25,
                  },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{
                  duration: 0.1,
                }}
              >
                <Input
                  autoFocus
                  size="xlarge"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.currentTarget.value)}
                  disabled={isDiffOpen}
                  inputRef={inputRef}
                  icon={
                    <div className="h-full flex flex-row gap-3 items-center">
                      <m.div layoutId="ask-ai-input-icon" className="ml-1">
                        <AiIcon className="w-4 h-4" />
                      </m.div>

                      {debugSolution && (
                        <div className="h-full w-full flex flex-row items-center overflow-y-hidden mr-[16.5rem] text-sm text-white">
                          {debugSolution}
                        </div>
                      )}
                    </div>
                  }
                  inputClassName="w-full !border-brand-900 border-none bg-transparent !shadow-none py-4 focus:!ring-0 placeholder:text-scale-900"
                  iconContainerClassName="transition text-scale-800 text-brand-900"
                  placeholder={!debugSolution ? 'Ask Supabase AI to modify your query' : ''}
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
              </m.div>
            ) : (
              <m.div
                key="ask-ai-loading"
                className="p-4 flex flex-row gap-2 items-center w-full"
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                  },
                  hidden: {
                    opacity: 0,
                    y: 25,
                  },
                }}
                transition={{
                  duration: 0.2,
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <m.div
                  className="text-brand-900"
                  animate={{
                    scale: [0.9, 1.1, 0.9],
                    transition: {
                      ease: 'linear',
                      duration: 2,
                      repeat: Infinity,
                    },
                  }}
                >
                  <AiIcon className="w-4 h-4" />
                </m.div>
                <m.span
                  animate={{
                    opacity: ['0.5', '0.75', '0.5'],
                    transition: {
                      ease: 'linear',
                      duration: 2,
                      repeat: Infinity,
                    },
                  }}
                >
                  Thinking...
                </m.span>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
        <Split
          style={{ height: '100%' }}
          direction="vertical"
          gutterSize={2}
          sizes={
            (splitSize ? splitSize : (snippet?.splitSizes as number[] | undefined)) ?? [50, 50]
          }
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
              <>
                {isDiffOpen && (
                  <m.div
                    className="w-full h-full"
                    variants={{
                      visible: {
                        opacity: 1,
                        filter: 'blur(0px)',
                      },
                      hidden: {
                        opacity: 0,
                        filter: 'blur(10px)',
                      },
                    }}
                    initial="hidden"
                    animate="visible"
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
                  </m.div>
                )}
                <m.div
                  key={id}
                  variants={{
                    visible: {
                      opacity: 1,
                      filter: 'blur(0px)',
                    },
                    hidden: {
                      opacity: 0,
                      filter: 'blur(10px)',
                    },
                  }}
                  initial="hidden"
                  animate={isDiffOpen ? 'hidden' : 'visible'}
                  className="w-full h-full"
                >
                  <MonacoEditor
                    id={id}
                    editorRef={editorRef}
                    isExecuting={isExecuting}
                    autoFocus={false}
                    executeQuery={executeQuery}
                  />
                </m.div>
              </>
            )}
          </div>
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
    </SQLEditorContext.Provider>
  )
}

export default SQLEditor
