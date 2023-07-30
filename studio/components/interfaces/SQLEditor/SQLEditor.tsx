import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useSqlEditMutation } from 'data/ai/sql-edit-mutation'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { isError } from 'data/utils/error-check'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useLocalStorage,
  useLocalStorageQuery,
  useSelectedOrganization,
  useSelectedProject,
  useStore,
} from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
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
import {
  AiIcon,
  Button,
  Dropdown,
  IconCheck,
  IconChevronDown,
  IconCornerDownLeft,
  IconLoader,
  IconSettings,
  IconX,
  Input,
  Input_Shadcn_,
  cn,
} from 'ui'
import AISettingsModal from './AISettingsModal'
import {
  destructiveSqlRegex,
  sqlAiDisclaimerComment,
  untitledSnippetTitle,
} from './SQLEditor.constants'
import { IStandaloneCodeEditor, IStandaloneDiffEditor } from './SQLEditor.types'
import { createSqlSnippetSkeleton } from './SQLEditor.utils'
import UtilityPanel from './UtilityPanel/UtilityPanel'
import { AiIconAnimation } from 'components/animations/ai-icon'

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

enum DiffType {
  Modification = 'modification',
  Addition = 'addition',
  NewSnippet = 'new-snippet',
}

function getDiffTypeButtonLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Accept change'
    case DiffType.Addition:
      return 'Accept addition'
    case DiffType.NewSnippet:
      return 'Create new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

function getDiffTypeDropdownLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Compare as change'
    case DiffType.Addition:
      return 'Compare as addition'
    case DiffType.NewSnippet:
      return 'Compare as new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

const SQLEditor = () => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: editSql, isLoading: isEditSqlLoading } = useSqlEditMutation()
  const { mutateAsync: titleSql } = useSqlTitleGenerateMutation()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const [aiInput, setAiInput] = useState('')
  const [debugSolution, setDebugSolution] = useState<string>()
  const [sqlDiff, setSqlDiff] = useState<ContentDiff>()
  const inputRef = useRef<HTMLInputElement>(null)

  const [aiOpen, setAiOpen] = useState(false)

  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const isOptedInToAI =
    selectedOrganization?.opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false
  const [isOptedInToAISchema] = useLocalStorageQuery('supabase_sql-editor-ai-schema', false)
  const [isAcceptDiffLoading, setIsAcceptDiffLoading] = useState(false)

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && isOptedInToAISchema

  const [selectedDiffType, setSelectedDiffType] = useState(DiffType.Modification)

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

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
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)

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

  const executeQuery = useCallback(
    async (force: boolean = false) => {
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
        const sql = (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content.sql

        const containsDestructiveOperations = destructiveSqlRegex.some((regex) => regex.test(sql))

        if (!force && containsDestructiveOperations) {
          setIsConfirmModalOpen(true)
          return
        }

        // Intentionally don't await title gen
        setAiTitle()

        execute({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql,
        })
      }
    },
    [isExecuting, isDiffOpen, execute, project, setAiTitle]
  )

  const handleNewQuery = useCallback(
    async (sql: string, name: string) => {
      if (!ref) return console.error('Project ref is required')

      try {
        const snippet = createSqlSnippetSkeleton({ name, sql, owner_id: profile?.id })
        const data = { ...snippet, id: uuidv4() }
        snap.addSnippet(data as SqlSnippet, ref, true)
        router.push(`/project/${ref}/sql/${data.id}`)
      } catch (error: any) {
        ui.setNotification({
          category: 'error',
          message: `Failed to create new query: ${error.message}`,
        })
      }
    },
    [profile, ref, router, snap, ui]
  )

  const acceptAiHandler = useCallback(async () => {
    try {
      setIsAcceptDiffLoading(true)

      if (!sqlDiff) {
        return
      }

      // TODO: show error if undefined
      if (!editorRef.current || !diffEditorRef.current) {
        return
      }

      const editorModel = editorRef.current.getModel()
      const diffModel = diffEditorRef.current.getModel()

      if (!editorModel || !diffModel) {
        return
      }

      const sql = diffModel.modified.getValue()

      if (selectedDiffType === DiffType.NewSnippet) {
        const { title } = await titleSql({ sql })
        await handleNewQuery(sql, title)
      } else {
        editorRef.current.executeEdits('apply-ai-edit', [
          {
            text: sql,
            range: editorModel.getFullModelRange(),
          },
        ])
      }

      setAiInput('')
      setSelectedDiffType(DiffType.Modification)
      setDebugSolution(undefined)
      setSqlDiff(undefined)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    } finally {
      setIsAcceptDiffLoading(false)
    }
  }, [sqlDiff, selectedDiffType, handleNewQuery, titleSql])

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

  const compareAsModification = useCallback(() => {
    const model = diffEditorRef.current?.getModel()

    if (!model) {
      throw new Error("Diff editor's model not available")
    }

    if (!sqlDiff) {
      throw new Error('Returned SQL diff not available')
    }

    model.original.setValue(sqlDiff.original)
    model.modified.setValue(sqlDiff.modified)
  }, [sqlDiff])

  const compareAsAddition = useCallback(() => {
    const model = diffEditorRef.current?.getModel()

    if (!model) {
      throw new Error("Diff editor's model not available")
    }

    if (!sqlDiff) {
      throw new Error('Returned SQL diff not available')
    }

    const formattedOriginal = sqlDiff.original.replace(sqlAiDisclaimerComment, '').trim()
    const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()
    const newModified =
      sqlAiDisclaimerComment + '\n\n' + formattedOriginal + '\n\n' + formattedModified

    model.original.setValue(sqlDiff.original)
    model.modified.setValue(newModified)
  }, [sqlDiff])

  const compareAsNewSnippet = useCallback(() => {
    const model = diffEditorRef.current?.getModel()

    if (!model) {
      throw new Error("Diff editor's model not available")
    }

    if (!sqlDiff) {
      throw new Error('Returned SQL diff not available')
    }

    model.original.setValue('')
    model.modified.setValue(sqlDiff.modified)
  }, [sqlDiff])

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
      <AISettingsModal visible={isAISettingsOpen} onCancel={() => setIsAISettingsOpen(false)} />
      <ConfirmModal
        visible={isConfirmModalOpen}
        title="Destructive operation"
        description="We've detected a potentially destructive operation in the query. Please confirm that you would like to execute this query."
        buttonLabel="Execute query"
        onSelectCancel={() => {
          setIsConfirmModalOpen(false)
        }}
        onSelectConfirm={() => {
          setIsConfirmModalOpen(false)
          executeQuery(true)
        }}
      />
      <div className="flex h-full flex-col relative">
        {aiOpen && (
          <motion.div
            key="ask-ai-input-container"
            layoutId="ask-ai-input-container"
            variants={{
              visible: {
                borderRadius: 0,
              },
            }}
            initial="visible"
            animate="visible"
            className="w-full flex justify-center z-10 h-[60px] bg-brand-300 border-b border-brand-400 px-5"
          >
            <div
              className={cn(
                'w-full !border-brand-900 border-none !shadow-none  placeholder:text-scale-900',
                'flex items-center gap-3'
              )}
            >
              <AiIconAnimation loading={isEditSqlLoading} />

              <AnimatePresence initial={false} exitBeforeEnter>
                {debugSolution && (
                  <div className="h-full w-full flex flex-row items-center overflow-y-hidden text-sm text-white">
                    {debugSolution}
                  </div>
                )}
                {!isEditSqlLoading ? (
                  <motion.div
                    key="ask-ai-input"
                    className="w-full h-full relative flex items-center"
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
                    <Input_Shadcn_
                      autoFocus
                      value={aiInput}
                      onChange={(e) => setAiInput(e.currentTarget.value)}
                      disabled={isDiffOpen}
                      ref={inputRef}
                      className={cn(
                        '!p-0 bg-transparent border-transparent text-sm text-brand placeholder:text-brand-500 focus:!ring-0',
                        'focus-visible:ring-0 focus-visible:ring-offset-0',
                        'appearance-none outline-none'
                        // "after:content-['_↗']",
                        // 'after:relative after:w-10 after:h-10',
                        // 'after:placeholder:content-["hello"]'
                      )}
                      placeholder={!debugSolution ? 'Ask Supabase AI to modify your query' : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' && !aiInput) {
                          setAiOpen(false)
                        }
                      }}
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter') {
                          console.log('entering')
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
                              entityDefinitions,
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
                              ui.setNotification({
                                category: 'error',
                                message:
                                  'Unable to edit SQL. Try adding more details to your prompt.',
                              })
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
                    {/* <div className="opacity-30">
                      <IconCornerDownLeft size={12} strokeWidth={1.5} />
                    </div> */}
                  </motion.div>
                ) : (
                  <motion.div
                    key="ask-ai-loading"
                    className="p-0 flex flex-row gap-2 items-center w-full"
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
                    <motion.span
                      className="text-sm text-brand px-3"
                      animate={{
                        opacity: ['0.5', '0.75', '0.5'],
                        transition: {
                          ease: 'linear',
                          duration: 0.33,
                          repeat: Infinity,
                        },
                      }}
                    >
                      Thinking...
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-row items-center gap-2">
                {isDiffOpen ? (
                  <>
                    <div className="flex items-center">
                      <Button
                        className="rounded-r-none"
                        type="primary"
                        size="tiny"
                        icon={
                          !isAcceptDiffLoading ? (
                            <IconCheck />
                          ) : (
                            <IconLoader className="animate-spin" size={14} />
                          )
                        }
                        iconRight={
                          <div className="opacity-30">
                            <IconCornerDownLeft size={12} strokeWidth={1.5} />
                          </div>
                        }
                        onClick={acceptAiHandler}
                      >
                        {getDiffTypeButtonLabel(selectedDiffType)}
                      </Button>
                      <Dropdown
                        align="end"
                        side="bottom"
                        overlay={Object.values(DiffType)
                          .filter((diffType) => diffType !== selectedDiffType)
                          .map((diffType) => (
                            <Dropdown.Item
                              key={diffType}
                              onClick={() => {
                                setSelectedDiffType(diffType)
                                switch (diffType) {
                                  case DiffType.Modification:
                                    return compareAsModification()
                                  case DiffType.Addition:
                                    return compareAsAddition()
                                  case DiffType.NewSnippet:
                                    return compareAsNewSnippet()
                                  default:
                                    throw new Error(`Unknown diff type '${diffType}'`)
                                }
                              }}
                            >
                              {getDiffTypeDropdownLabel(diffType)}
                            </Dropdown.Item>
                          ))}
                      >
                        <Button
                          type="primary"
                          className="rounded-l-none border-l-0 px-[4px] py-[5px]"
                          icon={<IconChevronDown />}
                        />
                      </Dropdown>
                    </div>
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
                  <>
                    <div
                      className={cn('transition text-brand', !aiInput ? 'opacity-0' : 'opacity-30')}
                    >
                      <IconCornerDownLeft size={16} strokeWidth={1.5} />
                    </div>
                    <button
                      onClick={() => setIsAISettingsOpen(true)}
                      className="text-brand-500 hover:text-brand hover:text transition"
                    >
                      <IconSettings className="cursor-pointer" />
                    </button>
                    <button
                      className="text-brand hover:text-brand-600"
                      onClick={() => setAiOpen(false)}
                    >
                      <IconX size={21} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
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
          <div className="flex-grow overflow-y-auto border-b">
            {!aiOpen && (
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className={cn(
                  'group',
                  'absolute z-10',
                  'rounded-lg',
                  'right-[18px] top-4',
                  'transition-all duration-200',
                  'ease-out'
                )}
              >
                <AiIconAnimation loading={false} allowHoverEffect />
              </button>
            )}

            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">Loading...</div>
            ) : (
              <>
                {isDiffOpen && (
                  <motion.div
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
                      onMount={(editor) => {
                        diffEditorRef.current = editor
                        let isFirstLoad = true

                        editor.onDidUpdateDiff(() => {
                          if (!isFirstLoad) {
                            return
                          }

                          const model = editor.getModel()
                          const lineChanges = editor.getLineChanges()

                          if (!model || !lineChanges || lineChanges.length === 0) {
                            return
                          }

                          const original = model.original.getValue()
                          const formattedOriginal = format(
                            original.replace(sqlAiDisclaimerComment, '').trim(),
                            {
                              language: 'postgresql',
                              keywordCase: 'lower',
                            }
                          )
                          const modified = model.modified.getValue()

                          const lineStart = original.includes(sqlAiDisclaimerComment)
                            ? (sqlAiDisclaimerComment + '\n\n').split('\n').length
                            : 0
                          const lineEnd = model.original.getLineCount()
                          const totalLines = lineEnd - lineStart

                          // If any change overwrites >50% of the original code,
                          // and the the modified code doesn't contain the original code,
                          // predict that this is an addition instead of a modification
                          const isAddition =
                            lineChanges.some(
                              (lineChange) =>
                                lineChange.originalEndLineNumber -
                                  lineChange.originalStartLineNumber >
                                totalLines * 0.5
                            ) && !modified.includes(formattedOriginal)

                          if (isAddition) {
                            setSelectedDiffType(DiffType.Addition)
                            compareAsAddition()
                          }

                          isFirstLoad = false
                        })
                      }}
                      options={{
                        fontSize: 13,
                      }}
                    />
                  </motion.div>
                )}
                <motion.div
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
                </motion.div>
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
