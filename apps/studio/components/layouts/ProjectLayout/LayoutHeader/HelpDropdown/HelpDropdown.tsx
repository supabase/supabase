import { IS_PLATFORM } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { HelpCircle } from 'lucide-react'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SVG from 'react-inlinesvg'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Button,
  cn,
  Popover,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import { ASSISTANT_SUGGESTIONS } from './HelpDropdown.constants'
import { getSupportLinkQueryParams } from './HelpDropdown.utils'
import { HelpSection } from './HelpSection'

export const HelpDropdown = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isOpen, setIsOpen] = useState(false)

  const projectRef = project?.parent_project_ref ?? (router.query.ref as string | undefined)
  const supportLinkQueryParams = getSupportLinkQueryParams(
    project,
    org,
    router.query.ref as string | undefined
  )

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
      <PopoverContent_Shadcn_ className="w-[400px] space-y-5 p-0 py-5" align="end" side="bottom">
        <HelpSection
          className="px-5"
          excludeIds={['discord']}
          isPlatform={IS_PLATFORM}
          projectRef={projectRef}
          supportLinkQueryParams={supportLinkQueryParams}
          onAssistantClick={() => {
            setIsOpen(false)
            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            snap.newChat(ASSISTANT_SUGGESTIONS)
          }}
          onSupportClick={() => setIsOpen(false)}
        />
        <Popover.Separator />
        <div className="flex flex-col gap-4">
          <div className="px-5 flex flex-col gap-0.5">
            <h5 className="text-foreground">Community support</h5>
            <p className="text-xs text-foreground-lighter text-balance">
              Our Discord community can help with code-related issues. Many questions are answered
              in minutes.
            </p>
          </div>
          <div className="px-5">
            <div
              className="relative space-y-2 overflow-hidden rounded px-5 py-4 pb-12 shadow-md"
              style={{ background: '#404EED' }}
            >
              <a
                href="https://discord.supabase.com"
                target="_blank"
                rel="noreferrer"
                className="group dark block cursor-pointer"
              >
                <Image
                  className="absolute left-0 top-0 opacity-50 transition-opacity group-hover:opacity-40"
                  src={`${router.basePath}/img/support/discord-bg-small.jpg`}
                  layout="fill"
                  objectFit="cover"
                  alt="Discord illustration"
                />
                <Button
                  type="secondary"
                  size="tiny"
                  icon={<SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />}
                >
                  <span style={{ color: '#404EED' }}>Join us on Discord</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
