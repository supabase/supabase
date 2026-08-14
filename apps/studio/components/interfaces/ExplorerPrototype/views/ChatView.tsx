/**
 * PROTOTYPE — Agent chat view.
 *
 * The agent query block is the *same* QueryCell component the notebook and
 * notebook views render, passed `readOnly`. What differs is chrome, not machinery:
 * an approval footer in the footer slot, and a data-sharing gate on the results.
 *
 * Messages stay at a readable measure; agent query blocks run the full width,
 * matching how a query cell behaves in a notebook.
 */

import { Check, Settings, X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import type {
  CellResultState,
  ChatSession,
  NotebookContent,
  QueryCellModel,
} from '../ExplorerPrototype.types'
import { RESOURCE_ICON } from '../ExplorerResources'
import { QueryCell } from '../QueryCell'
import type { NotebookTarget } from '../QueryCell'
import { TabToolbar } from '../TabToolbar'
import { ChatComposer } from './ChatComposer'
import { NotebookView } from './NotebookView'
import { Markdown } from '@/components/interfaces/Markdown'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/AIAssistantPanel/elements/Conversation'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

interface ChatViewProps {
  chat: ChatSession
  results: Record<string, CellResultState>
  onApprove: (messageId: string, cell: QueryCellModel) => void
  onApproveNotebook: (messageId: string, title: string, notebook: NotebookContent) => void
  onDeny: (messageId: string) => void
  onSendMessage: (message: string) => void
  notebookTargets?: NotebookTarget[]
  onAddQueryToNotebook?: (query: QueryCellModel, notebookId: string) => void
  onExplainQuery?: (query: QueryCellModel) => void
}

const CHAT_ROW_LIMIT = 100
const MESSAGE_WIDTH = 'mx-auto w-full max-w-3xl'
const QUERY_WIDTH = 'mx-auto w-full max-w-5xl'
const SHARING_STATUS: Record<AiOptInLevel, string> = {
  disabled: 'Not sharing with the Assistant',
  schema: 'Sharing schema with the Assistant',
  schema_and_log: 'Sharing schema and logs with the Assistant',
  schema_and_log_and_data: 'Sharing results with the Assistant',
}

interface AssistantApprovalBarProps {
  prompt: string
  confirmLabel: string
  onConfirm: () => void
  onDeny: () => void
}

const AssistantApprovalBar = ({
  prompt,
  confirmLabel,
  onConfirm,
  onDeny,
}: AssistantApprovalBarProps) => (
  <div className={`${MESSAGE_WIDTH} -mt-5 rounded-b-md border border-t-0 bg-surface-200 px-3 py-2`}>
    <div className="flex items-center gap-3">
      <p className="flex-1 text-xs text-foreground-light">{prompt}</p>
      <Button variant="default" size="tiny" icon={<X size={12} />} onClick={onDeny}>
        Skip
      </Button>
      <Button
        variant="primary"
        size="tiny"
        className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:animate-shimmer before:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.22),transparent)] before:bg-[length:200%_100%] before:[animation-duration:12s]"
        icon={<Check size={12} />}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  </div>
)

export const ChatView = ({
  chat,
  results,
  onApprove,
  onApproveNotebook,
  onDeny,
  onSendMessage,
  notebookTargets = [],
  onAddQueryToNotebook,
  onExplainQuery,
}: ChatViewProps) => {
  // Stands in for `useOrgAiOptInLevel()` — query results only reach the model
  // at the `schema_and_log_and_data` level.
  const [sharingLevel, setSharingLevel] = useState<AiOptInLevel>('disabled')
  const canShareResults = sharingLevel === 'schema_and_log_and_data'

  return (
    <div className="flex h-full flex-col">
      <TabToolbar
        icon={RESOURCE_ICON.chat}
        title={chat.name}
        actions={
          <>
            <span className="text-xs text-foreground-light">{SHARING_STATUS[sharingLevel]}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="tiny"
                  className="w-7 px-0"
                  aria-label="Chat settings"
                  icon={<Settings size={14} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Sharing preferences</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sharingLevel}
                  onValueChange={(value) => setSharingLevel(value as AiOptInLevel)}
                >
                  <DropdownMenuRadioItem value="disabled">Share nothing</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="schema">Share schema</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="schema_and_log">Share logs</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="schema_and_log_and_data">
                    Share data
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Conversation className="min-h-0 scroll-fade no-scrollbar">
        <ConversationContent className="flex w-full flex-col gap-5 px-6 py-6">
          {chat.messages.map((message) => {
            if ('text' in message) {
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={cn(MESSAGE_WIDTH, isUser && 'flex justify-end')}>
                  <div
                    className={cn(
                      'text-sm',
                      isUser
                        ? 'max-w-[75%] rounded-xl bg-surface-200 px-3 py-2'
                        : 'max-w-2xl text-foreground-light'
                    )}
                  >
                    <Markdown
                      content={message.text}
                      className={cn(
                        'max-w-none',
                        !isUser && 'prose prose-sm max-w-2xl prose-headings:text-foreground'
                      )}
                    />
                  </div>
                </div>
              )
            }

            if ('notebook' in message) {
              const isPending = message.approval === 'pending'

              return (
                <div key={message.id} className="contents">
                  <div className={QUERY_WIDTH}>
                    <NotebookView
                      embedded
                      readOnly
                      title={message.notebook.title}
                      notebook={message.notebook.content}
                      results={results}
                      onCellChange={() => undefined}
                      onAddCell={() => undefined}
                      onRemoveCell={() => undefined}
                      onMoveCell={() => undefined}
                      onMoveCellTo={() => undefined}
                      onSettingsChange={() => undefined}
                      onRunCell={() => undefined}
                      onRunAll={() => undefined}
                      notebookTargets={notebookTargets}
                      onAddQueryToNotebook={onAddQueryToNotebook}
                      onExplainQuery={onExplainQuery}
                    />
                  </div>
                  {isPending && (
                    <AssistantApprovalBar
                      prompt="The Assistant wants to create this notebook."
                      confirmLabel="Create notebook"
                      onDeny={() => onDeny(message.id)}
                      onConfirm={() =>
                        onApproveNotebook(
                          message.id,
                          message.notebook.title,
                          message.notebook.content
                        )
                      }
                    />
                  )}
                </div>
              )
            }

            const result = results[message.cell.id] ?? { status: 'idle' as const }
            const isPending = message.approval === 'pending'
            const isDenied = message.approval === 'denied'

            return (
              <div key={message.id} className="contents">
                <div className={QUERY_WIDTH}>
                  <QueryCell
                    value={message.cell}
                    result={result}
                    rowLimit={CHAT_ROW_LIMIT}
                    readOnly
                    notebookTargets={notebookTargets}
                    onAddToNotebook={
                      onAddQueryToNotebook
                        ? (notebookId) => onAddQueryToNotebook(message.cell, notebookId)
                        : undefined
                    }
                    onExplain={onExplainQuery ? () => onExplainQuery(message.cell) : undefined}
                    onRun={isPending ? undefined : () => onApprove(message.id, message.cell)}
                    footerSlot={
                      <>
                        {isDenied && (
                          <div className="border-t px-3 py-1">
                            <p className={`${MESSAGE_WIDTH} text-xs text-foreground-lighter`}>
                              Skipped — the query was not run.
                            </p>
                          </div>
                        )}
                        {result.status === 'success' && (
                          <div className="border-t px-3 py-1">
                            <p className={`${MESSAGE_WIDTH} text-xs text-foreground-lighter`}>
                              {canShareResults
                                ? 'Results sent to the Assistant.'
                                : 'Results shown here only — data sharing is off, so rows are not sent to the Assistant.'}
                            </p>
                          </div>
                        )}
                      </>
                    }
                  />
                </div>
                {isPending && (
                  <AssistantApprovalBar
                    prompt="The Assistant wants to run this query."
                    confirmLabel="Run query"
                    onDeny={() => onDeny(message.id)}
                    onConfirm={() => onApprove(message.id, message.cell)}
                  />
                )}
              </div>
            )
          })}
        </ConversationContent>
        <ConversationScrollButton aria-label="Jump to latest" />
      </Conversation>

      <div className="p-4">
        <ChatComposer onSubmit={onSendMessage} />
      </div>
    </div>
  )
}
