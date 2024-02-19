import { useEffect, useState } from 'react'
import { IconDocumentation, IconMicSolid, IconProductHunt, IconYoutubeSolid, cn } from 'ui'

import Link from 'next/link'
import { StepLink } from '../data/lwx_data'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'

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
  const Icon = icon ?? linkTypes[type].icon
  const Text = () => <>{text ?? linkTypes[type]?.text}</>

  const Component = type === 'video' ? 'div' : Link

  const Asd = ({ component: Comp, ...props }: any) => (
    <Comp
      className={cn(
        'py-1 flex gap-2 items-center hover:text-foreground transition-colors text-sm',
        className
      )}
      {...props}
    >
      <span className="w-4 h-4 flex items-center justify-center">
        <Icon />
      </span>
      <Text />
    </Comp>
  )

  if (type === 'video')
    return <ExpandableVideo videoId={href} trigger={<Asd component={Component} />} />

  return <Asd href={href} target={isTargetBlank() ? '_blank' : '_self'} component={Component} />
}

export default {
  DayLink,
}
