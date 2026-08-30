import {
  Clipboard,
  Edit,
  Maximize,
  MessageCirclePlus,
  MoreVertical,
  Settings,
  X,
} from 'lucide-react'
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

import { ButtonTooltip } from '../ButtonTooltip'
import { ShortcutPills, ShortcutTooltip } from '../ShortcutTooltip'
import { AIAssistantChatSelector } from './AIAssistantChatSelector'
import { AIAssistantMetadataWarning } from './AIAssistantMetadataWarning'
import { useCreateChat } from '@/components/interfaces/Explorer/hooks'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface AIAssistantHeaderProps {
  isChatLoading: boolean
  shortcutsEnabled?: boolean
  onNewChat: () => void
  onCloseAssistant: () => void
  showMetadataWarning: boolean
  updatedOptInSinceMCP: boolean
  isHipaaProjectDisallowed: boolean
  aiOptInLevel: 'disabled' | 'schema' | 'full' | string | undefined
}

export const AIAssistantHeader = ({
  isChatLoading,
  shortcutsEnabled = true,
  onNewChat,
  onCloseAssistant,
  showMetadataWarning,
  updatedOptInSinceMCP,
  isHipaaProjectDisallowed,
  aiOptInLevel,
}: AIAssistantHeaderProps) => {
  const snap = useAiAssistantStateSnapshot()
  const { openChat } = useCreateChat()
  const [value, setValue] = useState(snap.activeChat?.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

  const handleOpenInExplorer = () => {
    if (!snap.activeChatId) return
    openChat(snap.activeChatId)
    onCloseAssistant()
  }

  const handleCopyChatId = () => {
    copyToClipboard(snap.activeChatId ?? '', () => {
      toast.success(`Copied chat ID for ${snap.activeChat?.name}`)
    })
  }

  const handleSaveName = () => {
    if (snap.activeChatId && value?.trim()) {
      snap.renameChat(snap.activeChatId, value.trim())
    }
    setIsEditingName(false)
  }

  const handleKeyDownInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setIsEditingName(false)
      setValue(snap.activeChat?.name)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveName()
    }
  }

  const handleBlurInput = () => {
    if (isEditingName) handleSaveName()
  }

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_COPY_CHAT_ID, handleCopyChatId, {
    enabled: shortcutsEnabled && !isChatLoading,
  })

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS, () => setIsOptInModalOpen(true), {
    enabled: shortcutsEnabled && !isChatLoading,
  })

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_MAXIMIZE, handleOpenInExplorer, {
    enabled: shortcutsEnabled && !isChatLoading,
  })

  return (
    <div className="z-30 sticky top-0">
      <div className="border-b border-b-muted flex items-center bg-card gap-x-4 px-3 min-h-(--header-height)">
        <div className="text-sm flex-1 min-w-0 flex items-center gap-x-1">
          {isEditingName ? (
            <Input
              autoFocus
              value={value}
              size="tiny"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDownInput}
              onBlur={handleBlurInput}
            />
          ) : (
            <Button
              variant="text"
              className="group min-w-0"
              iconRight={<Edit className="transition opacity-0 group-hover:opacity-100" />}
              onClick={() => {
                setValue(snap.activeChat?.name)
                setIsEditingName(true)
              }}
            >
              {snap.activeChat?.name}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-x-4 shrink-0">
          <div className="flex items-center">
            <AIAssistantChatSelector shortcutsEnabled={shortcutsEnabled} />

            <ShortcutTooltip
              side="bottom"
              label="New chat"
              shortcutId={SHORTCUT_IDS.AI_ASSISTANT_NEW_CHAT}
            >
              <Button
                variant="text"
                aria-label="New chat"
                size="tiny"
                icon={<MessageCirclePlus />}
                onClick={onNewChat}
                className="h-7 w-7 p-0"
              />
            </ShortcutTooltip>

            <ShortcutTooltip
              side="bottom"
              label="Open in Explorer"
              shortcutId={SHORTCUT_IDS.AI_ASSISTANT_MAXIMIZE}
            >
              <Button
                variant="text"
                aria-label="Open in Explorer"
                size="tiny"
                icon={<Maximize />}
                onClick={handleOpenInExplorer}
                className="h-7 w-7 p-0"
              />
            </ShortcutTooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonTooltip
                  variant="text"
                  size="tiny"
                  icon={<MoreVertical />}
                  className="h-7 w-7 p-0"
                  disabled={isChatLoading}
                  tooltip={{ content: { side: 'bottom', text: 'More options' } }}
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

            <ShortcutTooltip
              side="bottom"
              label="Close assistant"
              shortcutId={SHORTCUT_IDS.AI_ASSISTANT_TOGGLE}
            >
              <Button
                aria-label="Close Assistant"
                variant="text"
                className="w-7 h-7"
                onClick={onCloseAssistant}
                icon={<X strokeWidth={1.5} />}
              />
            </ShortcutTooltip>
          </div>
        </div>
      </div>

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
