'use client'

import { useMemo } from 'react'
import { AiIconAnimation, Button, cn, flattenTree, TreeView, TreeViewItem } from 'ui'

import type { DocsAiChatSession } from './chatHistory.types'
import { formatSessionTimestamp } from './formatSessionTimestamp'

const HISTORY_ITEM_HEIGHT_PX = 34
const HISTORY_MAX_VISIBLE_ITEMS = 6

interface DocsAiChatHistoryProps {
  activeChatId: string
  className?: string
  onClearHistory: () => void
  onSelectChat: (chatId: string) => void
  sessions: DocsAiChatSession[]
}

function DocsAiChatHistory({
  activeChatId,
  className,
  onClearHistory,
  onSelectChat,
  sessions,
}: DocsAiChatHistoryProps) {
  const historySessions = useMemo(
    () =>
      sessions
        .filter((session) => session.messages.length > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions]
  )

  const flattenedData = useMemo(() => {
    return flattenTree({
      name: 'Chats',
      children: historySessions.map((session) => ({
        name: session.title,
        metadata: {
          chatId: session.id,
          updatedAt: session.updatedAt,
        },
        children: [],
      })),
    })
  }, [historySessions])

  const defaultExpandedIds = useMemo(
    () => flattenedData.filter((node) => node.children?.length).map((node) => node.id),
    [flattenedData]
  )

  const defaultSelectedIds = useMemo(
    () =>
      flattenedData
        .filter((node) => node.metadata?.chatId === activeChatId)
        .map((node) => node.id),
    [activeChatId, flattenedData]
  )

  if (historySessions.length < 2) {
    return null
  }

  return (
    <div className={cn('border-b px-2 py-2', className)}>
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-mono uppercase tracking-widest text-foreground-muted">
          History
        </span>
        {historySessions.length >= 1 && (
          <Button type="text" size="tiny" onClick={onClearHistory}>
            Clear history
          </Button>
        )}
      </div>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: HISTORY_ITEM_HEIGHT_PX * HISTORY_MAX_VISIBLE_ITEMS }}
      >
        <TreeView
          key={activeChatId}
          data={flattenedData}
          aria-label="Chat history"
          className="w-full"
          defaultExpandedIds={defaultExpandedIds}
          defaultSelectedIds={defaultSelectedIds}
          onNodeSelect={({ element, isBranch }) => {
            if (isBranch) return
            const chatId = element.metadata?.chatId
            if (typeof chatId === 'string') {
              onSelectChat(chatId)
            }
          }}
          nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => {
            const updatedAt =
              typeof element.metadata?.updatedAt === 'number' ? element.metadata.updatedAt : null

            return (
              <TreeViewItem
                {...getNodeProps()}
                isExpanded={isExpanded}
                isBranch={isBranch}
                isSelected={isSelected}
                level={level}
                levelPadding={28}
                xPadding={12}
                name={element.name}
                nameForTitle={typeof element.name === 'string' ? element.name : undefined}
                icon={
                  isBranch ? undefined : (
                    <AiIconAnimation size={14} className="shrink-0" allowHoverEffect={false} />
                  )
                }
                actions={
                  updatedAt !== null ? (
                    <span className="shrink-0 pl-2 text-[10px] tabular-nums text-foreground-muted">
                      {formatSessionTimestamp(updatedAt)}
                    </span>
                  ) : undefined
                }
                className="gap-1.5 text-xs"
              />
            )
          }}
        />
      </div>
    </div>
  )
}

export { DocsAiChatHistory }
