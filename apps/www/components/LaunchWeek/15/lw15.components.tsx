import { useEffect, useState } from 'react'
import { IconDocumentation, IconMicSolid, IconProductHunt, IconYoutubeSolid, cn } from 'ui'
import { Music } from 'lucide-react'

import Link from 'next/link'
import { StepLink } from './data/lw15_data'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { useTheme } from 'next-themes'

export const LWSVG = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="270"
      height="146"
      viewBox="0 0 270 146"
      className="h-full w-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M21.2516 0.5V127.9H97.8516V145.5H0.851562V0.5H21.2516Z" fill="currentColor" />
      <path
        d="M192.348 0.5L220.948 122.3L247.748 0.5H269.148L232.948 145.5H208.148L180.148 26.3L152.748 145.5H127.948L91.1484 0.5H113.548L141.548 122.3L168.348 0.5H192.348Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const FifteenSVG = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="185"
      height="148"
      viewBox="0 0 185 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M52.1653 145.393H33.8891V31.6856H0.148438V19.252C20.8347 18.6504 31.8807 15.6423 39.7134 0H52.1653V145.393Z"
        fill="currentColor"
      />
      <path
        d="M132.332 132.759C149.805 132.759 164.868 120.125 164.868 97.664C164.868 73.5989 147.998 63.1707 132.132 63.1707C117.069 63.1707 107.228 71.9946 104.014 79.2141L85.7381 78.2114L95.1775 0H178.726V17.0461H110.039L105.019 58.3577C112.851 50.9377 124.299 47.3279 136.349 47.3279C161.855 47.3279 184.148 65.3767 184.148 97.4634C184.148 130.753 159.445 148 132.332 148C98.7925 148 83.1272 126.743 80.5163 103.279H99.3951C102.408 121.729 112.048 132.759 132.332 132.759Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const LW15ThemeSwitcher = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  return (
    <div className={cn('flex items-center justify-start gap-2', className)} {...props}>
      <button
        onClick={() => setTheme('dark')}
        className={cn(isDarkMode ? 'text-foreground' : 'text-foreground-lighter')}
      >
        dark mode
      </button>{' '}
      /
      <button
        onClick={() => setTheme('light')}
        className={cn(!isDarkMode ? 'text-foreground' : 'text-foreground-lighter')}
      >
        light mode
      </button>
    </div>
  )
}

interface DayLink extends StepLink {
  className?: string
}

export const DayLink = ({ type, icon, text, href = '', className }: DayLink) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const linkTypes = {
    blog: {
      icon: IconDocumentation,
      text: 'Blog Post',
    },
    docs: {
      icon: IconDocumentation,
      text: 'Docs',
    },
    productHunt: {
      icon: IconProductHunt,
      text: 'Product Hunt',
    },
    video: {
      icon: IconYoutubeSolid,
      text: 'Watch video',
    },
    podcast: {
      icon: Music,
      text: 'Podcast',
    },
    xSpace: {
      icon: IconMicSolid,
      text: 'X Space',
    },
  }
  const isTargetBlank = () => {
    switch (type) {
      case 'productHunt':
      case 'xSpace':
      case 'docs':
        return true
    }
  }
  const Text = () => <>{text ?? linkTypes[type]?.text}</>

  const Component = type === 'video' ? 'div' : Link

  const Trigger = ({ component: Comp, ...props }: any) => (
    <Comp
      className={cn(
        'py-1 flex gap-2 items-center text-white/70 hover:text-white transition-colors text-sm !leading-none',
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 bg-current flex items-center justify-center" />
      <Text />
    </Comp>
  )

  if (type === 'video')
    return <ExpandableVideo videoId={href} trigger={<Trigger component={Component} />} />

  return <Trigger href={href} target={isTargetBlank() ? '_blank' : '_self'} component={Component} />
}

export default {
  DayLink,
}
