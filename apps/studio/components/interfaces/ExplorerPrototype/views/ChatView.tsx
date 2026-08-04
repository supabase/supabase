/**
 * PROTOTYPE — Agent chat view.
 *
 * The agent query block is the *same* QueryCell component the notebook and
 * snippet views render, passed `readOnly`. What differs is chrome, not machinery:
 * an approval footer in the footer slot, and a data-sharing gate on the results.
 *
 * Messages stay at a readable measure; agent query blocks run the full width,
 * matching how a query cell behaves in a notebook.
 */

import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Button, cn, Switch } from 'ui'

import type { CellResultState, ChatSession, QueryCellModel } from '../ExplorerPrototype.types'
import { RESOURCE_ICON } from '../ExplorerResources'
import { QueryCell } from '../QueryCell'
import { TabToolbar } from '../TabToolbar'
import { Markdown } from '@/components/interfaces/Markdown'

interface ChatViewProps {
  chat: ChatSession
  results: Record<string, CellResultState>
  onApprove: (messageId: string, cell: QueryCellModel) => void
  onDeny: (messageId: string) => void
}

const CHAT_ROW_LIMIT = 100

/** Message measure — agent query blocks deliberately break out of this. */
const PROSE_WIDTH = 'mx-auto w-full max-w-3xl'

export const ChatView = ({ chat, results, onApprove, onDeny }: ChatViewProps) => {
  // Stands in for `useOrgAiOptInLevel()` — results only reach the model at
  // the `schema_and_log_and_data` level.
  const [canShareResults, setCanShareResults] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TabToolbar
        icon={RESOURCE_ICON.chat}
        title={chat.name}
        actions={
          <span className="flex items-center gap-2 text-xs text-foreground-light">
            Share results with the Assistant
            <Switch
              aria-label="Share results with the Assistant"
              checked={canShareResults}
              onCheckedChange={setCanShareResults}
            />
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {chat.messages.map((message) => {
            if (!('cell' in message)) {
              return (
                <div key={message.id} className={cn('flex', PROSE_WIDTH)}>
                  <div
                    className={cn(
                      'rounded-md px-3 py-2 text-sm',
                      message.role === 'user' ? 'ml-auto bg-surface-200' : 'bg-transparent'
                    )}
                  >
                    <Markdown content={message.text} className="max-w-none" />
                  </div>
                </div>
              )
            }

            const result = results[message.cell.id] ?? { status: 'idle' as const }
            const isPending = message.approval === 'pending'
            const isDenied = message.approval === 'denied'

            return (
              <QueryCell
                key={message.id}
                value={message.cell}
                result={result}
                rowLimit={CHAT_ROW_LIMIT}
                readOnly
                onRun={isPending ? undefined : () => onApprove(message.id, message.cell)}
                footerSlot={
                  <>
                    {isPending && (
                      <div className="flex items-center gap-3 border-t bg-surface-200 px-3 py-2">
                        <p className="flex-1 text-xs text-foreground-light">
                          The Assistant wants to run this query.
                        </p>
                        <Button
                          variant="default"
                          size="tiny"
                          icon={<X size={12} />}
                          onClick={() => onDeny(message.id)}
                        >
                          Skip
                        </Button>
                        <Button
                          variant="primary"
                          size="tiny"
                          icon={<Check size={12} />}
                          onClick={() => onApprove(message.id, message.cell)}
                        >
                          Run query
                        </Button>
                      </div>
                    )}
                    {isDenied && (
                      <p className="border-t px-3 py-1 text-xs text-foreground-lighter">
                        Skipped — the query was not run.
                      </p>
                    )}
                    {result.status === 'success' && (
                      <p className="border-t px-3 py-1 text-xs text-foreground-lighter">
                        {canShareResults
                          ? 'Results sent to the Assistant.'
                          : 'Results shown here only — data sharing is off, so rows are not sent to the Assistant.'}
                      </p>
                    )}
                  </>
                }
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
