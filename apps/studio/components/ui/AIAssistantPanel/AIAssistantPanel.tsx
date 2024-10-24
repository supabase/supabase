import { useQueryClient } from '@tanstack/react-query'
import { uniqBy } from 'lodash'
import { Command, CornerDownLeft, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useChat } from 'ai/react'
import { useParams } from 'common'
import { useIsDatabaseFunctionsAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { generateThreadMessage } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel/AIPolicyEditorPanel.utils'
import { MessageWithDebug } from 'components/interfaces/SQLEditor/AiAssistantPanel'
import { sqlAiDisclaimerComment } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { DiffType, IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { sqlKeys } from 'data/sql/keys'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { usePrevious } from 'hooks/deprecated'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { SqlEditor } from 'icons'
import {
  BASE_PATH,
  LOCAL_STORAGE_KEYS,
  TELEMETRY_ACTIONS,
  TELEMETRY_CATEGORIES,
  TELEMETRY_LABELS,
} from 'lib/constants'
import { detectOS, uuidv4 } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import CodeEditor from '../CodeEditor/CodeEditor'
import { AIAssistant } from './AIAssistant'
import { generateCTA, generatePlaceholder, generateTitle, validateQuery } from './AIAssistant.utils'
import { ASSISTANT_SUPPORT_ENTITIES } from './AiAssistant.constants'

export const AiAssistantPanel = () => {
  const os = detectOS()
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const queryClient = useQueryClient()
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const isEnabled = useIsDatabaseFunctionsAssistantEnabled()

  const { open, editor, content } = aiAssistantPanel
  const previousEditor = usePrevious(editor)

  const [isAcknowledged, setIsAcknowledged] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SQL_SCRATCH_PAD_BANNER_ACKNOWLEDGED,
    false
  )

  const [chatId, setChatId] = useState(() => uuidv4())
  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showResults, setShowResults] = useState(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [debugThread, setDebugThread] = useState<MessageWithDebug[]>([])

  // [Joshen] JFYI I'm opting to just have the assistant always show and not toggle-able
  // I don't really see any negatives of keeping it open (or benefits from hiding) tbh
  // const [showAssistant, setShowAssistant] = useState(true)
  const title = generateTitle(editor)
  const placeholder = generatePlaceholder(editor)
  const ctaText = generateCTA(editor)
  const editorRef = useRef<IStandaloneCodeEditor | undefined>()
  const editorModel = editorRef.current?.getModel()

  const numResults = (results ?? []).length
  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []
  const entityContext = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === editor)

  const { mutate: sendEvent } = useSendEventMutation()
  const sendTelemetryEvent = (action: string) => {
    sendEvent({
      action,
      category: TELEMETRY_CATEGORIES.AI_ASSISTANT,
      label: TELEMETRY_LABELS.QUICK_SQL_EDITOR,
    })
  }

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      // [Joshen] If in a specific editor context mode, assume that intent was to create/update
      // a database entity - so close it once success. Otherwise it's in Quick SQL mode and we
      // show the results. Currently though it assumes we're "creating", thinking need to support "updating" too
      if (editor !== null) {
        switch (editor) {
          case 'functions':
            await queryClient.invalidateQueries(sqlKeys.query(ref, ['functions-list']))
            break
          case 'rls-policies':
            await queryClient.invalidateQueries(databasePoliciesKeys.list(ref))
            break
        }

        toast.success(`Successfully created ${entityContext?.name}!`)
        setAiAssistantPanel({ open: false })
      } else {
        setShowResults(true)
        setResults(res.result)
      }
    },
    onError: (error) => {
      setError(error)
      setResults([])
    },
  })

  const { append } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    // [Joshen] Don't need entity definitions if calling here cause support action
    // via AI here is just to explain code segment, no need for context
    body: {},
  })

  const { mutateAsync: debugSql } = useSqlDebugMutation({ onError: () => {} })

  const onExecuteSql = (skipValidation = false) => {
    setError(undefined)
    setShowWarning(false)

    const query = editorRef.current?.getValue() ?? ''
    if (query.length === 0) return

    if (editor !== undefined && !skipValidation) {
      // [Joshen] Some basic validation logic
      const validated = validateQuery(editor, query)
      if (!validated) {
        return setShowWarning(true)
      }
    }

    executeSql({
      sql: suffixWithLimit(query, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        throw error
      },
    })
  }

  const onFixWithAssistant = async () => {
    if (!error) return

    const messageId = uuidv4()
    const query = editorRef.current?.getValue() ?? ''

    const assistantMessageBefore = generateThreadMessage({
      id: messageId,
      content: 'Thinking...',
      isDebug: true,
    })

    setDebugThread([...debugThread, assistantMessageBefore])
    sendTelemetryEvent(TELEMETRY_ACTIONS.FIX_WITH_ASSISTANT)

    try {
      const { solution, sql } = await debugSql({
        sql: query,
        errorMessage: error.message,
      })

      const assistantMessageAfter = generateThreadMessage({
        id: messageId,
        content: `${solution}\n\`\`\`sql\n${sql}\n\`\`\``,
        isDebug: true,
      })
      const cleanedMessages = uniqBy([...debugThread, assistantMessageAfter], (m) => m.id)
      setDebugThread(cleanedMessages)
    } catch (error) {
      const assistantMessageAfter = generateThreadMessage({
        id: messageId,
        content: `Hmm, Sorry but I'm unable to find a solution for the error that you're facing`,
        isDebug: true,
      })
      const cleanedMessages = uniqBy([...debugThread, assistantMessageAfter], (m) => m.id)
      setDebugThread(cleanedMessages)
    }
  }

  const onExplainSql = (value: string) => {
    append({
      role: 'user',
      createdAt: new Date(),
      content: `
        Can you explain this section to me in more detail?\n
        ${value}
    `.trim(),
    })
    sendTelemetryEvent(TELEMETRY_ACTIONS.EXPLAIN_CODE)
  }

  const updateEditorWithCheckForDiff = useCallback(
    ({ id, diffType, sql }: { id: string; diffType: DiffType; sql: string }) => {
      if (!editorModel) return

      const existingValue = editorRef.current?.getValue() ?? ''
      if (existingValue.length === 0) {
        // if the editor is empty, just copy over the code
        editorRef.current?.executeEdits('apply-ai-message', [
          {
            text: `${sqlAiDisclaimerComment}\n\n${sql}`,
            range: editorModel.getFullModelRange(),
          },
        ])
      } else {
        const currentSql = editorRef.current?.getValue()
        editorRef.current?.executeEdits('apply-ai-message', [
          {
            text: `${currentSql}\n\n${sqlAiDisclaimerComment}\n\n${sql}`,
            range: editorModel.getFullModelRange(),
          },
        ])
      }
    },
    [editorModel]
  )

  useEffect(() => {
    if (open) {
      // [Joshen] Only reset the assistant if the editor changed
      if (previousEditor !== editor) {
        setChatId(uuidv4())
        setError(undefined)
        setShowWarning(false)
        setDebugThread([])
        setResults(undefined)
        setShowResults(false)
      } else {
        // [Joshen] Repopulate the code editor with the content from where the user left off
        // setTimeout is just to give time for the editorRef to get associated
        setTimeout(() => {
          const editorModel = editorRef.current?.getModel()
          if (content && editorModel) {
            editorRef.current?.executeEdits('apply-ai-message', [
              { text: content, range: editorModel.getFullModelRange() },
            ])
          }
        }, 100)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // [Joshen] Just to test the concept of a universal assistant of sorts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.code === 'KeyI') {
        setAiAssistantPanel({ open: true, editor: null })
      }
    }
    if (project !== undefined && isEnabled) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, isEnabled])

  // [Joshen] Whenever the deps change recalculate the height of the editor
  useEffect(() => {
    editorRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => editorRef.current?.layout())
  }, [error, showWarning, isExecuting, numResults, showResults])

  return (
    <Sheet
      open={open}
      onOpenChange={() => {
        if (open) {
          // [Joshen] Save the code content when closing - should allow users to continue from
          // where they left off IF they are opening the assistant again in the same "editor" context
          const existingValue = editorRef.current?.getValue() ?? ''
          setAiAssistantPanel({ open: false, content: existingValue })
        } else {
          setAiAssistantPanel({ open: true })
        }
      }}
    >
      <SheetContent showClose={true} className={cn('flex gap-0 w-[1200px]')}>
        {/* Assistant */}
        <AIAssistant
          id={chatId}
          className="border-r w-1/2"
          debugThread={debugThread}
          onDiff={updateEditorWithCheckForDiff}
          onResetConversation={() => setChatId(uuidv4())}
        />

        {/* Editor */}
        <div className={cn('flex flex-col grow w-1/2')}>
          <SheetHeader className="flex items-center justify-between py-3 pr-12">
            {title}
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="outline"
                  icon={<SqlEditor />}
                  className="h-[24px] w-[24px] px-1"
                  onClick={() => {
                    const content = editorRef.current?.getValue() ?? ''
                    router.push(`/project/${ref}/sql/new?content=${encodeURIComponent(content)}`)
                    setAiAssistantPanel({ open: false })
                  }}
                />
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom">Open in SQL Editor</TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </SheetHeader>
          {editor === null && !isAcknowledged && (
            <Admonition
              showIcon={false}
              type="default"
              title="This is a quick access SQL editor to run queries on your database"
              className="relative m-0 rounded-none border-x-0 border-t-0 [&>div]:m-0"
            >
              <span>
                Queries written here will not be saved and results are limited up to only 100 rows
              </span>
              <Button
                type="text"
                icon={<X />}
                className="px-1.5 absolute top-2 right-2"
                onClick={() => setIsAcknowledged(true)}
              />
            </Admonition>
          )}
          <div className="flex flex-col h-full justify-between">
            <div className="relative flex-grow block">
              <CodeEditor
                id="assistant-code-editor"
                language="pgsql"
                editorRef={editorRef}
                placeholder={placeholder}
                actions={{
                  runQuery: { enabled: true, callback: () => onExecuteSql() },
                  explainCode: { enabled: true, callback: onExplainSql },
                  closeAssistant: {
                    enabled: true,
                    callback: () => setAiAssistantPanel({ open: false }),
                  },
                }}
              />
            </div>
            <div className="flex flex-col">
              {error !== undefined && (
                <Admonition
                  type="warning"
                  className="m-0 rounded-none border-x-0 border-b-0 [&>div>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
                  title={errorHeader || 'Error running SQL query'}
                  description={
                    <>
                      <div>
                        {errorContent.length > 0 ? (
                          errorContent.map((errorText: string, i: number) => (
                            <pre key={`err-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                              {errorText}
                            </pre>
                          ))
                        ) : (
                          <p className="font-mono text-xs">{error.error}</p>
                        )}
                      </div>
                      <Button type="default" className="w-min" onClick={() => onFixWithAssistant()}>
                        Fix with Assistant
                      </Button>
                    </>
                  }
                />
              )}
              {showWarning && (
                <Admonition
                  type="default"
                  className="m-0 rounded-none border-x-0 border-b-0 [&>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
                  title={`Your query doesn't seem to be relevant to ${
                    entityContext?.id === 'rls-policies'
                      ? entityContext?.label
                      : `Database ${entityContext?.label}`
                  }`}
                  description={
                    <>
                      <p>Are you sure you want to run this query?</p>
                      <Button type="default" className="w-min" onClick={() => onExecuteSql(true)}>
                        Confirm run query
                      </Button>
                    </>
                  }
                />
              )}
              {results !== undefined && results.length > 0 && (
                <>
                  <div className={cn(showResults ? 'h-72 border-t' : 'h-0')}>
                    <Results rows={results} />
                  </div>
                  <div className="flex items-center justify-between border-t bg-surface-100 py-2 pl-2 pr-5">
                    <p className="text-xs text-foreground-light">
                      {results.length} rows
                      {results.length >= 100 && ` (Limited to only 100 rows)`}
                    </p>
                    <Button size="tiny" type="default" onClick={() => setShowResults(!showResults)}>
                      {showResults ? 'Hide' : 'Show'} results
                    </Button>
                  </div>
                </>
              )}
              {results !== undefined && results.length === 0 && (
                <div className="flex items-center justify-between border-t bg-surface-100 h-[43px] pl-2 pr-5">
                  <p className="text-xs text-foreground-light">Success. No rows returned.</p>
                </div>
              )}
              <SheetFooter className="bg-surface-100 flex items-center !justify-end px-5 py-4 w-full border-t">
                <Button
                  type="default"
                  disabled={isExecuting}
                  onClick={() => setAiAssistantPanel({ open: false })}
                >
                  Cancel
                </Button>
                <Button
                  loading={isExecuting}
                  onClick={() => onExecuteSql()}
                  iconRight={
                    isExecuting ? (
                      <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
                    ) : (
                      <div className="flex items-center space-x-1">
                        {os === 'macos' ? (
                          <Command size={10} strokeWidth={1.5} />
                        ) : (
                          <p className="text-xs text-foreground-light">CTRL</p>
                        )}
                        <CornerDownLeft size={10} strokeWidth={1.5} />
                      </div>
                    )
                  }
                >
                  {ctaText}
                </Button>
              </SheetFooter>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
