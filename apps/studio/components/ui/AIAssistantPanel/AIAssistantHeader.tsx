import { Clipboard, Ellipsis, Plus, Settings, X } from 'lucide-react'
import { useState } from 'react'
import {
  AiIconAnimation,
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { ButtonTooltip } from '../ButtonTooltip'
import { ShortcutTooltip } from '../ShortcutTooltip'
import { AIAssistantChatSelector } from './AIAssistantChatSelector'
import { AIOptInModal } from './AIOptInModal'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface AIAssistantHeaderProps {
  isChatLoading: boolean
  onNewChat: () => void
  onCloseAssistant: () => void
  showMetadataWarning: boolean
  updatedOptInSinceMCP: boolean
  isHipaaProjectDisallowed: boolean
  aiOptInLevel: 'disabled' | 'schema' | 'full' | string | undefined
}

export const AIAssistantHeader = ({
  isChatLoading,
  onNewChat,
  onCloseAssistant,
  showMetadataWarning,
  updatedOptInSinceMCP,
  isHipaaProjectDisallowed,
  aiOptInLevel,
}: AIAssistantHeaderProps) => {
  const snap = useAiAssistantStateSnapshot()
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS, () => setIsOptInModalOpen(true), {
    enabled: !isChatLoading,
  })

  return (
    <div className="z-30 sticky top-0">
      <div className="border-b border-b-muted flex items-center bg-card gap-x-4 pl-4 pr-3 min-h-(--header-height)">
        <div className="text-sm flex-1 flex items-center">
          <AiIconAnimation size={18} allowHoverEffect={false} />
          <span className="text-border-stronger dark:text-border-strong ml-2">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              shapeRendering="geometricPrecision"
            >
              <path d="M16 3.549L7.12 20.600" />
            </svg>
          </span>
          <AIAssistantChatSelector />
        </div>
        <div className="flex items-center gap-x-4">
          <div className="flex items-center">
            <ShortcutTooltip
              side="bottom"
              label="New chat"
              shortcutId={SHORTCUT_IDS.AI_ASSISTANT_NEW_CHAT}
            >
              <Button
                variant="text"
                aria-label="New chat"
                size="tiny"
                icon={<Plus strokeWidth={1.5} />}
                onClick={onNewChat}
                className="h-7 w-7 p-0"
              />
            </ShortcutTooltip>

            <ShortcutTooltip side="bottom" shortcutId={SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS}>
              <Button
                variant="text"
                aria-label="Permission settings"
                size="tiny"
                icon={<Settings strokeWidth={1.5} />}
                onClick={() => setIsOptInModalOpen(true)}
                className="h-7 w-7 p-0"
                disabled={isChatLoading}
              />
            </ShortcutTooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonTooltip
                  variant="text"
                  size="tiny"
                  icon={<Ellipsis strokeWidth={1.5} />}
                  className="h-7 w-7 p-0"
                  tooltip={{ content: { side: 'bottom', text: 'More options' } }}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="gap-x-2"
                  onClick={() => copyToClipboard(snap.activeChatId ?? '')}
                >
                  <Clipboard size={14} strokeWidth={1.5} />
                  <span>Copy chat ID</span>
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
      {showMetadataWarning && (
        <Admonition
          type="default"
          title={
            !updatedOptInSinceMCP
              ? 'The Assistant has just been updated to help you better!'
              : isHipaaProjectDisallowed
                ? 'Project metadata is not shared due to HIPAA'
                : aiOptInLevel === 'disabled'
                  ? 'Project metadata is currently not shared'
                  : 'Limited metadata is shared to the Assistant'
          }
          description={
            !updatedOptInSinceMCP
              ? 'You may now opt-in to share schema metadata and even logs for better results'
              : isHipaaProjectDisallowed
                ? 'Your organization has the HIPAA addon and will not send project metadata with your prompts for projects marked as HIPAA.'
                : aiOptInLevel === 'disabled'
                  ? 'The Assistant can provide better answers if you opt-in to share schema metadata.'
                  : aiOptInLevel === 'schema'
                    ? 'Sharing query data in addition to schema can further improve responses. Update AI settings to enable this.'
                    : ''
          }
          className="border-0 border-b rounded-none bg-background"
        >
          {!isHipaaProjectDisallowed && (
            <Button
              variant="default"
              className="w-fit mt-4"
              onClick={() => setIsOptInModalOpen(true)}
            >
              Permission settings
            </Button>
          )}
        </Admonition>
      )}
      <AIOptInModal visible={isOptInModalOpen} onCancel={() => setIsOptInModalOpen(false)} />
    </div>
  )
}
