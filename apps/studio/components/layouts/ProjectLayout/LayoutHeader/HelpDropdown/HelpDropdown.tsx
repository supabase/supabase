import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { HelpCircle } from 'lucide-react'
import { useRouter } from 'next-router-mock'
import { useState } from 'react'
import { cn, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

import { HelpContent } from './HelpContent'
import { getSupportLinkQueryParams } from './HelpDropdown.utils'

export const HelpDropdown = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          id="help-dropdown-button"
          type="outline"
          size="tiny"
          className={cn(
            'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group',
            isOpen && 'bg-foreground text-background'
          )}
          onClick={() => {
            if (isOpen) return // Don't send telemetry event if dropdown is already open
            sendEvent({
              action: 'help_button_clicked',
              groups: { project: project?.ref, organization: org?.slug },
            })
          }}
          tooltip={{ content: { side: 'bottom', text: 'Help' } }}
        >
          <HelpCircle
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-light group-hover:text-foreground',
              isOpen && 'text-background group-hover:text-background'
            )}
          />
        </ButtonTooltip>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[400px] p-0" align="end" side="bottom">
        <HelpContent
          onClose={() => setIsOpen(false)}
          projectRef={project?.ref}
          supportLinkQueryParams={getSupportLinkQueryParams(
            project,
            org,
            router.query.ref as string | undefined
          )}
        />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
