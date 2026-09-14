import { Clipboard, MessageSquare, MoreVertical, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

  const handleCopyChatId = () => {
    copyToClipboard(chatId, () => toast.success(`Copied chat ID for ${chat?.name}`))
  }

  const handleSaveName = (name: string) => {
    if (name.trim()) snap.renameChat(chatId, name.trim())
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
        <ExplorerToolbarTitle onSaveTitle={handleSaveName}>{chat?.name ?? ''}</ExplorerToolbarTitle>
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
