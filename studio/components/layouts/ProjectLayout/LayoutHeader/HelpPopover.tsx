import * as Tooltip from '@radix-ui/react-tooltip'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'
import {
  Button,
  IconActivity,
  IconBookOpen,
  IconHelpCircle,
  IconMail,
  IconMessageCircle,
  IconTool,
  Popover,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

interface HelpPopoverProps {
  alt?: boolean
}

const HelpPopover = ({ alt = false }: HelpPopoverProps) => {
  const router = useRouter()
  const projectRef = router.query.ref
  const supportUrl = `/support/new${projectRef ? `?ref=${projectRef}` : ''}`

  return (
    <Popover_Shadcn_>
      <Tooltip.Root delayDuration={0}>
        <PopoverTrigger_Shadcn_ asChild>
          <Tooltip.Trigger asChild>
            <div className="relative flex items-center">
              <Button
                id="help-popover-button"
                type={alt ? 'text' : 'default'}
                className={alt ? 'px-1' : ''}
                icon={
                  <IconHelpCircle
                    size={alt ? 18 : 16}
                    strokeWidth={1.5}
                    className={alt ? 'text-foreground-light' : 'text-foreground-lighter'}
                  />
                }
              >
                {!alt && <span>Help</span>}
              </Button>
            </div>
          </Tooltip.Trigger>
        </PopoverTrigger_Shadcn_>
        {alt ? (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'space-y-2 border border-background',
                ].join(' ')}
              >
                <p className="text-xs text-foreground">Help</p>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        ) : null}
      </Tooltip.Root>
      <PopoverContent_Shadcn_ className="w-[400px] space-y-4 p-0 py-5" align="end" side="bottom">
        <div className="mb-5 space-y-4 px-5">
          <h5 className="text-foreground">Need help with your project?</h5>
          <p className="text-sm text-foreground-lighter">
            For issues with your project hosted on supabase.com, or other inquiries about our hosted
            services.
          </p>
          <div className="space-x-1">
            <Button asChild type="default" icon={<IconTool />}>
              <Link
                href="https://supabase.com/docs/guides/platform/troubleshooting"
                target="_blank"
                rel="noreferrer"
              >
                Troubleshooting
              </Link>
            </Button>
            <Button asChild type="text" size="tiny" icon={<IconBookOpen />}>
              <Link href="https://supabase.com/docs/" target="_blank" rel="noreferrer">
                Docs
              </Link>
            </Button>
            <Button asChild type="text" size="tiny" icon={<IconActivity />}>
              <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                Supabase Status
              </Link>
            </Button>
          </div>
          <p className="text-sm text-foreground-lighter">
            Expected response time is based on your billing plan. Pro and Pay as You Go plans are
            prioritized.
          </p>
          <div>
            <Button asChild type="default" icon={<IconMail />}>
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
                <Button type="secondary" icon={<IconMessageCircle />}>
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
