import {
  Button,
  Divider,
  IconHelpCircle,
  IconMail,
  IconBookOpen,
  IconMessageCircle,
  Popover,
  Typography,
} from '@supabase/ui'
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
      className="w-80"
      align="end"
      side="bottom"
      sideOffset={8}
      overlay={
        <div className="space-y-4 my-4">
          <div className="px-5 space-y-4 my-5">
            <Typography.Title level={5} className={'mb-2'}>
              Need help with your project?
            </Typography.Title>
            <Typography.Text type="secondary" small>
              <p>
                For issues with your project hosted on supabase.com, or other inquiries about our
                hosted services.
              </p>
            </Typography.Text>
            <div className="flex space-x-2">
              <Link href={supportUrl}>
                <Button className="sbui-default-button--dark-white" size="tiny" icon={<IconMail />}>
                  Contact support
                </Button>
              </Link>
              <Link href="https://supabase.com/docs/">
                <Button type="secondary" size="tiny" icon={<IconBookOpen />}>
                  Docs
                </Button>
              </Link>
            </div>
            <Typography.Text type="secondary" small className="block opacity-50">
              Expected response time is based on your billing tier. Pro and Pay as You Go plans are
              prioritised.
            </Typography.Text>
          </div>
          <Divider light />
          <div className="space-y-2 mb-4">
            <div className="px-5 mb-4">
              <Typography.Title level={5} className={'mb-2'}>
                Reach out to the community
              </Typography.Title>
              <Typography.Text type="secondary" small className={'block mb-2'}>
                <p>
                  For other support, including questions on our client libraries, advice, or best
                  practices.
                </p>
              </Typography.Text>
            </div>
            <div className="px-5">
              <div
                className="relative px-5 py-4 pb-12 rounded overflow-hidden space-y-2 shadow-md"
                style={{ background: '#404EED' }}
              >
                <a
                  href="https://discord.supabase.com"
                  target="_blank"
                  className="block cursor-pointer"
                >
                  <Image
                    className="absolute left-0 top-0 opacity-50"
                    src={'/img/support/discord-bg-small.jpg'}
                    layout="fill"
                    objectFit="cover"
                    alt="discord illustration header"
                  />
                  <Button
                    className="sbui-default-button--dark-white"
                    type="default"
                    icon={<SVG src={`/img/discord-icon.svg`} className="w-4 h-4" />}
                  >
                    <span style={{ color: '#404EED' }}>Join Discord server</span>
                  </Button>
                </a>
              </div>
            </div>
            <div className="px-5">
              <div className="relative px-5 py-4 pb-12 rounded overflow-hidden space-y-2 shadow-md">
                <a
                  href="https://github.com/supabase/supabase/discussions"
                  target="_blank"
                  className="block cursor-pointer"
                >
                  <Image
                    className="absolute left-0 top-0 opacity-50"
                    src={'/img/support/github-bg.jpg?v-1'}
                    layout="fill"
                    objectFit="cover"
                    alt="discord illustration header"
                  />
                  <Button type="default" icon={<IconMessageCircle />}>
                    GitHub Discussions
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Button as="span" type="text" icon={<IconHelpCircle size={16} strokeWidth={2} />}>
        Help
      </Button>
    </Popover>
  )
}

export default HelpPopover
