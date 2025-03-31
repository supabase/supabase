import { Activity, BookOpen, HelpCircle, Mail, MessageCircle, Wrench } from 'lucide-react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Popover,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { useProjectContext } from '../ProjectContext'

const HelpPopover = () => {
  const router = useRouter()
  const { project } = useProjectContext()
  const org = useSelectedOrganization()

  const { mutate: sendEvent } = useSendEventMutation()

  const projectRef = project?.parent_project_ref ?? router.query.ref
  const supportUrl = `/support/new${projectRef ? `?ref=${projectRef}` : ''}`

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="text"
          className="px-1"
          icon={<HelpCircle size={16} strokeWidth={1.5} className="text-foreground-light" />}
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
        <div className="mb-5 space-y-4 px-5">
          <h5 className="text-foreground">Need help with your project?</h5>
          <p className="text-sm text-foreground-lighter">
            For issues with your project hosted on supabase.com, or other inquiries about our hosted
            services.
          </p>
          <div className="space-x-1">
            <Button asChild type="default" icon={<Wrench />}>
              <Link
                href="https://supabase.com/docs/guides/platform/troubleshooting"
                target="_blank"
                rel="noreferrer"
              >
                Troubleshooting
              </Link>
            </Button>
            <Button asChild type="text" size="tiny" icon={<BookOpen />}>
              <Link href="https://supabase.com/docs/" target="_blank" rel="noreferrer">
                Docs
              </Link>
            </Button>
            <Button asChild type="text" size="tiny" icon={<Activity />}>
              <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                Supabase Status
              </Link>
            </Button>
          </div>
          <p className="text-sm text-foreground-lighter">
            Expected response time is based on your billing plan. Projects on paid plans are
            prioritized.
          </p>
          <div>
            <Button asChild type="default" icon={<Mail />}>
              <Link href={supportUrl}>Contact Support</Link>
            </Button>
          </div>
        </div>
        <Popover.Separator />
        <div className="mb-4 space-y-2">
          <div className="mb-4 px-5">
            <h5 className={'mb-2'}>Reach out to the community</h5>

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

export default HelpPopover
