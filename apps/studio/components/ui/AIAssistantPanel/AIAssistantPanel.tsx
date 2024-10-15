import { Command, CornerDownLeft, Loader2, PanelRightOpen } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useChat } from 'ai/react'
import { generateThreadMessage } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel/AIPolicyEditorPanel.utils'
import { MessageWithDebug } from 'components/interfaces/SQLEditor/AiAssistantPanel'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { detectOS, uuidv4 } from 'lib/helpers'
import { uniqBy } from 'lodash'
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
  const project = useSelectedProject()
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel

  const [chatId, setChatId] = useState(uuidv4())
  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<any[]>([])
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [showAssistant, setShowAssistant] = useState(true) // Not sure if want to make this expandable
  const [debugThread, setDebugThread] = useState<MessageWithDebug[]>([])

  const showEditor = true // !!editor
  const title = generateTitle(editor)
  const placeholder = generatePlaceholder(editor)
  const ctaText = generateCTA(editor)
  const editorRef = useRef<IStandaloneCodeEditor | undefined>()

  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []
  const entityContext = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === editor)

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: (res) => {
      // [Joshen] If in a specific editor context mode, assume that intent was to create/update
      // a database entity - so close it once success. Otherwise it's in Quick SQL mode and we
      // show the results. Currently though it assumes we're "creating", thinking need to support "updating" too
      if (editor !== undefined) {
        toast.success(`Successfully created ${entityContext?.name}!`)
        setAiAssistantPanel({ open: false })
      } else {
        setResults(res.result)
      }
    },
    onError: (error) => setError(error),
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
  }

  useEffect(() => {
    setShowAssistant(open && editor === undefined)
    if (open) {
      // [Joshen] Should we reset the conversation here?
      setChatId(uuidv4())
      setError(undefined)
      setShowWarning(false)
      setDebugThread([])
    }
  }, [open, editor])

  // [Joshen] Just to test the concept of a universal assistant of sorts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.code === 'KeyI') {
        setAiAssistantPanel({ open: true })
      }
    }
    if (project !== undefined) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  // [Joshen] Whenever the deps change recalculate the height of the editor
  useEffect(() => {
    editorRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => editorRef.current?.layout())
  }, [error, showWarning, results.length])

  return (
    <Sheet open={open} onOpenChange={() => setAiAssistantPanel({ open: !open, editor: undefined })}>
      <SheetContent
        showClose={true}
        className={cn('flex gap-0', showEditor ? 'w-[1200px]' : 'w-[600px]')}
      >
        {/* Assistant */}
        <AIAssistant
          id={chatId}
          className={showEditor ? 'border-r w-1/2' : 'w-full'}
          debugThread={debugThread}
          onResetConversation={() => setChatId(uuidv4())}
        />

        {/* Editor */}
        {showEditor && (
          <div className={cn('flex flex-col grow w-1/2')}>
            <SheetHeader className="flex items-center gap-x-3 py-3">
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_>
                  <PanelRightOpen
                    size={16}
                    className="transition text-foreground-light hover:text-foreground cursor-pointer"
                  />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="bottom">Open Assistant</TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
              {title}
            </SheetHeader>
            {showEditor && (
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
                                <pre
                                  key={`err-${i}`}
                                  className="font-mono text-xs whitespace-pre-wrap"
                                >
                                  {errorText}
                                </pre>
                              ))
                            ) : (
                              <p className="font-mono text-xs">{error.error}</p>
                            )}
                          </div>
                          <Button
                            type="default"
                            className="w-min"
                            onClick={() => onFixWithAssistant()}
                          >
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
                          <Button
                            type="default"
                            className="w-min"
                            onClick={() => onExecuteSql(true)}
                          >
                            Confirm run query
                          </Button>
                        </>
                      }
                    />
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
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
