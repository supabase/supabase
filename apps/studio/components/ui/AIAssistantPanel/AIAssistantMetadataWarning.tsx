import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AIOptInModal } from './AIOptInModal'

interface AIAssistantMetadataWarningProps {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  showMetadataWarning: boolean
  updatedOptInSinceMCP: boolean
  isHipaaProjectDisallowed: boolean
  aiOptInLevel: 'disabled' | 'schema' | 'full' | string | undefined
}

export const AIAssistantMetadataWarning = ({
  visible,
  onVisibleChange,
  showMetadataWarning,
  updatedOptInSinceMCP,
  isHipaaProjectDisallowed,
  aiOptInLevel,
}: AIAssistantMetadataWarningProps) => (
  <>
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
          <Button variant="default" className="w-fit mt-4" onClick={() => onVisibleChange(true)}>
            Permission settings
          </Button>
        )}
      </Admonition>
    )}
    <AIOptInModal visible={visible} onCancel={() => onVisibleChange(false)} />
  </>
)
