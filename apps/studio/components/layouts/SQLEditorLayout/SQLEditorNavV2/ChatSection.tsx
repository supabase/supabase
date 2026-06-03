import { useParams } from 'common'
import { MessageCircle, Pencil, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, Input } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns'

import {
  SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_ICON_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME,
  SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
  SQL_EDITOR_NAV_LIST_INSET_CLASSNAME,
  SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME,
  SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME,
} from './SQLEditorNav.constants'
import { getSqlEditorNavItemPaddingClass, SqlEditorNavItem } from './SqlEditorNavItem'
import { SQLEditorSectionActions } from './SQLEditorSectionActions'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface ChatSectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getTime = (date: Date | string | number | undefined) => {
  if (!date) return 0
  if (date instanceof Date) return date.getTime()
  return new Date(date).getTime()
}

export const ChatSection = ({ open, onOpenChange }: ChatSectionProps) => {
  const router = useRouter()
  const { ref: projectRef, chatId } = useParams()
  const assistant = useAiAssistantStateSnapshot()
  const tabs = useTabsStateSnapshot()

  const [editingChatId, setEditingChatId] = useState<string>()
  const [editingChatName, setEditingChatName] = useState('')

  const chats = useMemo(
    () =>
      Object.values(assistant.chats).sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt)),
    [assistant.chats]
  )

  const navigateToChat = (id: string) => {
    if (!projectRef) return
    router.push(`/project/${projectRef}/sql/chats/${id}`)
  }

  const handleNewChat = () => {
    const newChatId = assistant.newChat()
    navigateToChat(newChatId)
  }

  const handleStartRename = (id: string, name: string) => {
    setEditingChatId(id)
    setEditingChatName(name)
  }

  const handleCancelRename = () => {
    setEditingChatId(undefined)
    setEditingChatName('')
  }

  const handleSaveRename = () => {
    if (!editingChatId) return

    const nextName = editingChatName.trim()
    if (nextName.length === 0) {
      handleCancelRename()
      return
    }

    assistant.renameChat(editingChatId, nextName)
    tabs.updateTab(createTabId('chat', { id: editingChatId }), { label: nextName })
    handleCancelRename()
  }

  const handleDeleteChat = (id: string) => {
    const nextChatId = assistant.deleteChat(id)
    tabs.removeTab(createTabId('chat', { id }))

    if (chatId !== id || !projectRef) return

    if (nextChatId) {
      router.push(`/project/${projectRef}/sql/chats/${nextChatId}`)
    } else {
      router.push(`/project/${projectRef}/sql`)
    }
  }

  return (
    <InnerSideMenuCollapsible
      open={open}
      onOpenChange={onOpenChange}
      className={SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME}
    >
      <div className="flex items-center w-full">
        <InnerSideMenuCollapsibleTrigger
          className={SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME}
          title="Chats"
        />
        <SQLEditorSectionActions
          onNewSnippet={handleNewChat}
          newSnippetTestId="sql-editor-chats-new-button"
          newSnippetTooltip="New chat"
        />
      </div>
      <InnerSideMenuCollapsibleContent className="group-data-open:pt-1">
        {!assistant.isInitialized ? (
          <div className="px-4 py-2 text-xs text-foreground-light">Loading...</div>
        ) : chats.length === 0 ? (
          <InnerSideBarEmptyPanel
            title="No chats"
            className="mx-2 px-3"
            description="Start a chat to work with the Assistant."
          />
        ) : (
          <div
            className={cn(
              'flex flex-col',
              SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
              SQL_EDITOR_NAV_LIST_INSET_CLASSNAME
            )}
          >
            {chats.map((chat) => {
              const tabId = createTabId('chat', { id: chat.id })
              const isPreview = tabs.previewTabId === tabId
              const isActive = !isPreview && chatId === chat.id
              const isEditing = editingChatId === chat.id

              const chatRow = isEditing ? (
                <div
                  className={cn(
                    'flex w-full items-center gap-x-2 rounded-md pr-2',
                    SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
                    SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME,
                    getSqlEditorNavItemPaddingClass(0)
                  )}
                >
                  <MessageCircle size={14} className={SQL_EDITOR_NAV_ITEM_ICON_CLASSNAME} />
                  <Input
                    autoFocus
                    size="tiny"
                    value={editingChatName}
                    onChange={(event) => setEditingChatName(event.target.value)}
                    onBlur={handleSaveRename}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleSaveRename()
                      } else if (event.key === 'Escape') {
                        event.preventDefault()
                        handleCancelRename()
                      }
                    }}
                  />
                </div>
              ) : (
                <SqlEditorNavItem
                  icon={<MessageCircle size={14} className="shrink-0" />}
                  label={chat.name}
                  isActive={isActive}
                  isPreview={isPreview}
                  onClick={() => navigateToChat(chat.id)}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    tabs.makeTabPermanent(tabId)
                  }}
                />
              )

              return (
                <ContextMenu key={chat.id} modal={false}>
                  <ContextMenuTrigger asChild>{chatRow}</ContextMenuTrigger>
                  <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
                    <ContextMenuItem
                      className="gap-x-2"
                      onSelect={() => handleStartRename(chat.id, chat.name)}
                      onFocusCapture={(e) => e.stopPropagation()}
                    >
                      <Pencil size={14} />
                      Rename chat
                    </ContextMenuItem>
                    {chats.length > 1 && (
                      <ContextMenuItem
                        className="gap-x-2"
                        onSelect={() => handleDeleteChat(chat.id)}
                        onFocusCapture={(e) => e.stopPropagation()}
                      >
                        <Trash size={14} />
                        Delete chat
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </div>
        )}
      </InnerSideMenuCollapsibleContent>
    </InnerSideMenuCollapsible>
  )
}
