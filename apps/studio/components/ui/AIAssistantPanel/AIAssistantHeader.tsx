import { Plus, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { AiIconAnimation, Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { ButtonTooltip } from '../ButtonTooltip'
import { AIAssistantChatSelector } from './AIAssistantChatSelector'
import { AIOptInModal } from './AIOptInModal'

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
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)
  return (
    <div className="z-30 sticky top-0">
      <div className="border-b border-b-muted flex items-center bg gap-x-4 pl-4 pr-3 min-h-[var(--header-height)]">
        <div className="text-sm flex-1 flex items-center">
          <AiIconAnimation size={20} allowHoverEffect={false} />
          <span className="text-border-stronger dark:text-border-strong ml-3">
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
            <ButtonTooltip
              type="text"
              size="tiny"
              icon={<Plus strokeWidth={1.5} />}
              onClick={onNewChat}
              className="h-7 w-7 p-0"
              tooltip={{ content: { side: 'bottom', text: 'New chat' } }}
            />
            <ButtonTooltip
              type="text"
              size="tiny"
              icon={<Settings strokeWidth={1.5} />}
              onClick={() => setIsOptInModalOpen(true)}
              className="h-7 w-7 p-0"
              disabled={isChatLoading}
              tooltip={{
                content: { side: 'bottom', text: 'Permission settings' },
              }}
            />
            <ButtonTooltip
              type="text"
              className="w-7 h-7"
              onClick={onCloseAssistant}
              icon={<X strokeWidth={1.5} />}
              tooltip={{ content: { side: 'bottom', text: 'Close assistant' } }}
            />
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
            <Button type="default" className="w-fit mt-4" onClick={() => setIsOptInModalOpen(true)}>
              Permission settings
            </Button>
          )}
        </Admonition>
      )}
      <AIOptInModal visible={isOptInModalOpen} onCancel={() => setIsOptInModalOpen(false)} />
    </div>
  )
}
