import { Activity, BookOpen, HelpCircle, Mail, MessageCircle, Wrench } from 'lucide-react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Popover,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { useProjectContext } from '../ProjectContext'

export const HelpPopover = () => {
  const router = useRouter()
  const { project } = useProjectContext()
  const org = useSelectedOrganization()
  const snap = useAiAssistantStateSnapshot()

  const { mutate: sendEvent } = useSendEventMutation()

  const projectRef = project?.parent_project_ref ?? router.query.ref
  const supportUrl = `/support/new${projectRef ? `?projectRef=${projectRef}` : ''}`

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="text"
          className="rounded-none w-[32px] h-[30px] group"
          icon={
            <HelpCircle
              size={18}
              strokeWidth={1.5}
              className="!h-[18px] !w-[18px] text-foreground-light group-hover:text-foreground"
            />
          }
          tooltip={{ content: { side: 'bottom', text: 'Help' } }}
          onClick={() => {
            sendEvent({
              action: 'help_button_clicked',
              groups: { project: project?.ref, organization: org?.slug },
            })
          }}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[400px] space-y-4 p-0 py-5" align="end" side="bottom">
        <div className="mb-5 px-5">
          <h5 className="text-foreground mb-2">Need help with your project?</h5>
          <p className="text-sm text-foreground-lighter">
            For issues with your project hosted on supabase.com or other hosted service inquiries.
            Response times are based on your billing plan, with paid plans prioritized.
          </p>
        </div>
        <div className="px-5">
          <ButtonGroup className="w-full">
            {projectRef && (
              <ButtonGroupItem
                size="tiny"
                icon={<AiIconAnimation allowHoverEffect size={14} />}
                onClick={() => {
                  snap.newChat({
                    name: 'Support',
                    open: true,
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
            <ButtonGroupItem size="tiny" icon={<Wrench strokeWidth={1.5} size={14} />} asChild>
              <a
                href="https://supabase.com/docs/guides/platform/troubleshooting"
                target="_blank"
                rel="noreferrer"
              >
                Troubleshooting
              </a>
            </ButtonGroupItem>
            <ButtonGroupItem size="tiny" icon={<BookOpen strokeWidth={1.5} size={14} />} asChild>
              <a href="https://supabase.com/docs/" target="_blank" rel="noreferrer">
                Docs
              </a>
            </ButtonGroupItem>
            <ButtonGroupItem size="tiny" icon={<Activity strokeWidth={1.5} size={14} />} asChild>
              <a href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                Supabase Status
              </a>
            </ButtonGroupItem>
            <ButtonGroupItem size="tiny" icon={<Mail strokeWidth={1.5} size={14} />}>
              <Link href={supportUrl}>Contact Support</Link>
            </ButtonGroupItem>
          </ButtonGroup>
        </div>
        <Popover.Separator />
        <div className="mb-4 space-y-2">
          <div className="mb-4 px-5">
            <h5 className="mb-2">Reach out to the community</h5>

            <p className="text-sm text-foreground-lighter">
              For other support, including questions on our client libraries, advice, or best
              practices.
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
                className="dark block cursor-pointer"
              >
                <Image
                  className="absolute left-0 top-0 opacity-50"
                  src={`${router.basePath}/img/support/discord-bg-small.jpg`}
                  layout="fill"
                  objectFit="cover"
                  alt="discord illustration header"
                />
                <Button
                  type="secondary"
                  icon={<SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />}
                >
                  <span style={{ color: '#404EED' }}>Join Discord server</span>
                </Button>
              </a>
            </div>
          </div>
          <div className="px-5">
            <div className="relative space-y-2 overflow-hidden rounded px-5 py-4 pb-12 shadow-md">
              <a
                href="https://github.com/supabase/supabase/discussions"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer"
              >
                <Image
                  className="absolute left-0 top-0 opacity-50"
                  src={`${router.basePath}/img/support/github-bg.jpg?v-1`}
                  layout="fill"
                  objectFit="cover"
                  alt="discord illustration header"
                />
                <Button type="secondary" icon={<MessageCircle />}>
                  GitHub Discussions
                </Button>
              </a>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
