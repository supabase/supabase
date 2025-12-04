import { Plus } from 'lucide-react'

import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation } from 'ui'

interface CreateTriggerButtonsProps {
  hasTables: boolean
  canCreateTriggers: boolean
  selectedSchema: string
  onCreateTrigger: () => void
  showPlusIcon?: boolean
  buttonType?: 'default'
}

export const CreateTriggerButtons = ({
  hasTables,
  canCreateTriggers,
  selectedSchema,
  onCreateTrigger,
  showPlusIcon = true,
  buttonType,
}: CreateTriggerButtonsProps) => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  return (
    <div className="flex items-center gap-x-2">
      <ButtonTooltip
        type={buttonType}
        disabled={!hasTables || !canCreateTriggers}
        onClick={onCreateTrigger}
        className="flex-grow"
        icon={showPlusIcon ? <Plus /> : undefined}
        tooltip={{
          content: {
            side: 'bottom',
            text: !hasTables
              ? 'Create a table first before creating triggers'
              : !canCreateTriggers
                ? 'You need additional permissions to create triggers'
                : undefined,
          },
        }}
      >
        New trigger
      </ButtonTooltip>

      {hasTables && (
        <ButtonTooltip
          type="default"
          disabled={!hasTables || !canCreateTriggers}
          className="px-1 pointer-events-auto"
          icon={<AiIconAnimation size={16} />}
          onClick={() => {
            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            aiSnap.newChat({
              name: 'Create new trigger',
              initialInput: `Create a new trigger for the schema ${selectedSchema} that does ...`,
              suggestions: {
                title:
                  'I can help you create a new trigger, here are a few example prompts to get you started:',
                prompts: [
                  {
                    label: 'Log Changes',
                    description: 'Create a trigger that logs changes to the users table',
                  },
                  {
                    label: 'Update Timestamp',
                    description: 'Create a trigger that updates updated_at timestamp',
                  },
                  {
                    label: 'Validate Email',
                    description: 'Create a trigger that validates email format before insert',
                  },
                ],
              },
            })
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateTriggers
                ? 'You need additional permissions to create triggers'
                : 'Create with Supabase Assistant',
            },
          }}
        />
      )}
    </div>
  )
}
