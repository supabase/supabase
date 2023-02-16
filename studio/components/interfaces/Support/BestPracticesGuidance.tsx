import { FC } from 'react'
import Image from 'next/image'
import SVG from 'react-inlinesvg'
import { Button, IconMessageCircle } from 'ui'

interface Props {}

const BestPracticesGuidance: FC<Props> = ({}) => {
  return (
    <div className="px-6 space-y-4">
      <div className="space-y-2">
        <p>Tap into the community</p>
        <p className="text-sm text-scale-1100">
          Find the answers you need with fellow developers building with Supabase by joining our
          GitHub discussions or on Discord - build the next best thing together.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div
          className="relative space-y-2 overflow-hidden rounded px-5 py-4 w-1/2 pb-20 shadow-md"
          style={{ background: '#404EED' }}
        >
          <a
            href="https://discord.supabase.com"
            target="_blank"
            className="dark block cursor-pointer"
          >
            <Image
              className="absolute left-0 top-0 opacity-50"
              src={'/img/support/discord-bg-small.jpg'}
              layout="fill"
              objectFit="cover"
              alt="discord illustration header"
            />
            <Button
              type="secondary"
              icon={<SVG src={`/img/discord-icon.svg`} className="h-4 w-4" />}
            >
              <span style={{ color: '#404EED' }}>Join Discord server</span>
            </Button>
          </a>
        </div>

        <div className="relative space-y-2 overflow-hidden rounded px-5 py-4 w-1/2 pb-20 shadow-md">
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
            <Button type="secondary" icon={<IconMessageCircle />}>
              GitHub Discussions
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default BestPracticesGuidance
