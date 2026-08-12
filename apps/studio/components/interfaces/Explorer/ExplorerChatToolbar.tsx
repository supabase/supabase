import { Clipboard, Edit, MessageSquare, MoreVertical, Settings } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from 'ui'

import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { AIAssistantMetadataWarning } from '@/components/ui/AIAssistantPanel/AIAssistantMetadataWarning'
import type { AssistantChatHeaderProps } from '@/components/ui/AIAssistantPanel/AssistantChat'
import { ShortcutPills } from '@/components/ui/ShortcutTooltip'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ExplorerChatToolbarProps extends AssistantChatHeaderProps {
  chatId: string
  shortcutsEnabled: boolean
}

export const ExplorerChatToolbar = ({
  chatId,
  shortcutsEnabled,
  isChatLoading,
  showMetadataWarning,
  updatedOptInSinceMCP,
  isHipaaProjectDisallowed,
  aiOptInLevel,
}: ExplorerChatToolbarProps) => {
  const snap = useAiAssistantStateSnapshot()
  const chat = snap.chats[chatId]
  const [value, setValue] = useState(chat?.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

  const handleCopyChatId = () => {
    copyToClipboard(chatId, () => toast.success(`Copied chat ID for ${chat?.name}`))
  }

  const handleSaveName = () => {
    if (value?.trim()) snap.renameChat(chatId, value.trim())
    setIsEditingName(false)
  }

  const handleKeyDownInput = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setValue(chat?.name)
      setIsEditingName(false)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      handleSaveName()
    }
  }

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_COPY_CHAT_ID, handleCopyChatId, {
    enabled: shortcutsEnabled && !isChatLoading,
  })
  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS, () => setIsOptInModalOpen(true), {
    enabled: shortcutsEnabled && !isChatLoading,
  })

  return (
    <div className="z-30 sticky top-0">
      <ExplorerToolbar aria-label="Chat toolbar">
        <ExplorerToolbarIcon>
          <MessageSquare />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle className="flex items-center gap-x-1">
          {isEditingName ? (
            <Input
              autoFocus
              value={value}
              size="tiny"
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDownInput}
              onBlur={handleSaveName}
            />
          ) : (
            <Button
              variant="text"
              className="group min-w-0"
              iconRight={<Edit className="transition opacity-0 group-hover:opacity-100" />}
              onClick={() => {
                setValue(chat?.name)
                setIsEditingName(true)
              }}
            >
              {chat?.name}
            </Button>
          )}
        </ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ExplorerToolbarAction
                aria-label="More options"
                icon={<MoreVertical />}
                disabled={isChatLoading}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem className="justify-between" onClick={handleCopyChatId}>
                <div className="flex items-center gap-x-2">
                  <Clipboard size={14} />
                  <span>Copy chat ID</span>
                </div>
                <ShortcutPills
                  sequence={SHORTCUT_DEFINITIONS[SHORTCUT_IDS.AI_ASSISTANT_COPY_CHAT_ID].sequence}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-between"
                onClick={() => setIsOptInModalOpen(true)}
              >
                <div className="flex items-center gap-x-2">
                  <Settings size={14} />
                  <span>Permission settings</span>
                </div>
                <ShortcutPills
                  sequence={
                    SHORTCUT_DEFINITIONS[SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS].sequence
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ExplorerToolbarActions>
      </ExplorerToolbar>
      <AIAssistantMetadataWarning
        visible={isOptInModalOpen}
        onVisibleChange={setIsOptInModalOpen}
        showMetadataWarning={showMetadataWarning}
        updatedOptInSinceMCP={updatedOptInSinceMCP}
        isHipaaProjectDisallowed={isHipaaProjectDisallowed}
        aiOptInLevel={aiOptInLevel}
      />
    </div>
  )
}
