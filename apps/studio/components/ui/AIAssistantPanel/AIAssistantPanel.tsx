import { Command, CornerDownLeft, Loader2, PanelRightOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
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
import CodeEditor from '../CodeEditor/CodeEditor'
import { AIAssistant } from './AIAssistant'
import { generateCTA, generatePlaceholder, generateTitle } from './AIAssistant.utils'
import { detectOS, uuidv4 } from 'lib/helpers'
import { useChat } from 'ai/react'
import { BASE_PATH } from 'lib/constants'
import { projectKeys } from 'data/projects/keys'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

// [Joshen] Idea is that this is sort of a universal assistant
// It can house different editors (like the table editor's SideEditorPanel)
// It can also be just the assistant standalone
// Trying to see what's the best way to build this for now
// AI assistant is always the left most pane, so that its toggleable with minimal UI shifting

// Perhaps end goal: we try to shift RLS assistant (and SQL editor assistant?) here maybe

export const AiAssistantPanel = () => {
  const os = detectOS()
  const project = useSelectedProject()
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel

  const [chatId, setChatId] = useState(uuidv4())
  const [showAssistant, setShowAssistant] = useState(true)

  const showEditor = true // !!editor
  const title = generateTitle(editor)
  const placeholder = generatePlaceholder(editor)
  const ctaText = generateCTA(editor)

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation()

  const { append } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: {}, // [Joshen] Am thinking we don't need entity definitions if calling here
  })

  // This should be like a scoped down SQL editor
  const onExecuteSql = (sql: string) => {
    executeSql({
      sql,
      autoLimit: 100,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        console.log('ERROR', error)
        throw error
      },
    })
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
    if (open) setChatId(uuidv4()) // [Joshen] Should we reset the conversation here?
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
  }, [project])

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
            {/* [Joshen]: Yknow this can just be a generic code editor - will support scratch pad UX */}
            {showEditor && (
              <div className="flex flex-col h-full justify-between">
                <div className="relative flex-grow block">
                  <CodeEditor
                    id="assistant-code-editor"
                    language="pgsql"
                    placeholder={placeholder}
                    actions={{
                      runQuery: { enabled: true, callback: onExecuteSql },
                      explainCode: { enabled: true, callback: onExplainSql },
                    }}
                  />
                </div>
                <div className="flex flex-col">
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
                      onClick={() => console.log('Need to hook this up')}
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
