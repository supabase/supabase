import {
  Button,
  IconHelpCircle,
  IconMail,
  IconMessageCircle,
  Popover,
  IconBookOpen,
  IconActivity,
  IconTool,
} from 'ui'
import { useRouter } from 'next/router'
import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import SVG from 'react-inlinesvg'

interface Props {}

const HelpPopover: FC<Props> = () => {
  const router = useRouter()
  const projectRef = router.query.ref
  const supportUrl = `/support/new${projectRef ? `?ref=${projectRef}` : ''}`

  return (
    <Popover
      size="content"
      align="end"
      side="bottom"
      sideOffset={8}
      overlay={
        <div className="my-4 w-[400px] space-y-4">
          <div className="my-5 space-y-4 px-5">
            <h5 className="text-scale-1200">Need help with your project?</h5>
            <p className="text-sm text-scale-900">
              For issues with your project hosted on iechor.com, or other inquiries about our
              hosted services.
            </p>
            <div className="space-x-1">
              <Link passHref href="https://iechor.com/docs/guides/platform/troubleshooting">
                <Button asChild type="default" icon={<IconTool />}>
                  <a target="_blank" rel="noreferrer">
                    Troubleshooting
                  </a>
                </Button>
              </Link>
              <Link passHref href="https://iechor.com/docs/">
                <Button asChild type="text" size="tiny" icon={<IconBookOpen />}>
                  <a target="_blank" rel="noreferrer">
                    Docs
                  </a>
                </Button>
              </Link>
              <Link passHref href="https://status.iechor.com/">
                <Button asChild type="text" size="tiny" icon={<IconActivity />}>
                  <a target="_blank" rel="noreferrer">
                    iEchor Status
                  </a>
                </Button>
              </Link>
            </div>
            <p className="text-sm text-scale-900">
              Expected response time is based on your billing plan. Pro and Pay as You Go plans are
              prioritized.
            </p>
            <div>
              <Link passHref href={supportUrl}>
                <Button asChild type="default" icon={<IconMail />}>
                  <a>Contact Support</a>
                </Button>
              </Link>
            </div>
          </div>
          <Popover.Separator />
          <div className="mb-4 space-y-2">
            <div className="mb-4 px-5">
              <h5 className={'mb-2'}>Reach out to the community</h5>

              <p className="text-sm text-scale-900">
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
                  href="https://discord.iechor.com"
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
                    icon={
                      <SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />
                    }
                  >
                    <span style={{ color: '#404EED' }}>Join Discord server</span>
                  </Button>
                </a>
              </div>
            </div>
            <div className="px-5">
              <div className="relative space-y-2 overflow-hidden rounded px-5 py-4 pb-12 shadow-md">
                <a
                  href="https://github.com/openmodels-base/iechor/discussions"
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
        </div>
      }
    >
      <Button
        asChild
        type="default"
        icon={<IconHelpCircle size={16} strokeWidth={1.5} className="text-scale-900" />}
      >
        <span>Help</span>
      </Button>
    </Popover>
  )
}

export default HelpPopover
