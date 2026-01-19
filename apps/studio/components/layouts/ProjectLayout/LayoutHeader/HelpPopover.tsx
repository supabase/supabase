import { Activity, BookOpen, HelpCircle, Mail, Wrench } from 'lucide-react'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SVG from 'react-inlinesvg'

import { IS_PLATFORM } from 'common'
import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  AiIconAnimation,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  cn,
  Popover,
  PopoverContent,
  PopoverSeparator,
  PopoverTrigger,
} from 'ui'

export const HelpPopover = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isOpen, setIsOpen] = useState(false)

  const projectRef = project?.parent_project_ref ?? (router.query.ref as string | undefined)
  let supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined = undefined
  if (projectRef) {
    supportLinkQueryParams = { projectRef }
  } else if (org?.slug) {
    supportLinkQueryParams = { orgSlug: org.slug }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="outline"
          size="tiny"
          className={cn(
            'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group',
            isOpen && 'bg-foreground text-background'
          )}
          onClick={() => {
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
      </PopoverTrigger>
      <PopoverContent className="w-[400px] space-y-5 p-0 py-5" align="end" side="bottom">
        <div className="flex flex-col gap-4">
          <div className="px-5 flex flex-col gap-1">
            <h5 className="text-foreground">Need help with your project?</h5>
            <p className="text-sm text-foreground-lighter text-balance">
              Start with our {projectRef ? 'Assistant, docs,' : 'docs'} or community.
            </p>
          </div>

          <div className="px-5">
            <ButtonGroup className="w-full">
              {projectRef && (
                <ButtonGroupItem
                  size="tiny"
                  icon={<AiIconAnimation allowHoverEffect size={14} />}
                  onClick={() => {
                    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                    snap.newChat({
                      name: 'Support',
                      initialInput: `I need help with my project`,
                      suggestions: {
                        title:
                          'I can help you with your project, here are some example prompts to get you started:',
                        prompts: [
                          {
                            label: 'Database Health',
                            description: 'Summarise my database health and performance',
                          },
                          {
                            label: 'Debug Logs',
                            description: 'View and debug my edge function logs',
                          },
                          {
                            label: 'RLS Setup',
                            description: 'Implement row level security for my tables',
                          },
                        ],
                      },
                    })
                  }}
                >
                  Supabase Assistant
                </ButtonGroupItem>
              )}
              <ButtonGroupItem size="tiny" icon={<BookOpen strokeWidth={1.5} size={14} />} asChild>
                <a href={`${DOCS_URL}/`} target="_blank" rel="noreferrer">
                  Docs
                </a>
              </ButtonGroupItem>
              <ButtonGroupItem size="tiny" icon={<Wrench strokeWidth={1.5} size={14} />} asChild>
                <a
                  href={`${DOCS_URL}/guides/troubleshooting?products=platform`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Troubleshooting
                </a>
              </ButtonGroupItem>
              {IS_PLATFORM && (
                <>
                  <ButtonGroupItem
                    asChild
                    size="tiny"
                    icon={<Activity strokeWidth={1.5} size={14} />}
                  >
                    <a href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                      Supabase status
                    </a>
                  </ButtonGroupItem>

                  <ButtonGroupItem asChild size="tiny" icon={<Mail strokeWidth={1.5} size={14} />}>
                    <SupportLink
                      queryParams={supportLinkQueryParams}
                      onClick={() => setIsOpen(false)}
                    >
                      Contact support
                    </SupportLink>
                  </ButtonGroupItem>
                </>
              )}
            </ButtonGroup>
          </div>
        </div>
        <PopoverSeparator />
        <div className="flex flex-col gap-4">
          <div className="px-5 flex flex-col gap-1">
            <h5 className="text-foreground">Community support</h5>
            <p className="text-sm text-foreground-lighter text-balance">
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
      </PopoverContent>
    </Popover>
  )
}
