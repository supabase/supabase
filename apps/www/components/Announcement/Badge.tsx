import React from 'react'
import Link from 'next/link'
import { Badge, cn } from 'ui'
import { ArrowNarrowRightIcon } from '@heroicons/react/outline'

interface Props {
  url: string
  announcement: string
  badge?: string
  target?: '_self' | '_blank' | string
  className?: string
  hasArrow?: boolean
}

const AnnouncementBadge = ({
  url,
  announcement,
  badge,
  target = '_self',
  className,
  hasArrow = true,
}: Props) => (
  <div
    className={cn(
      'relative w-full max-w-xl flex justify-center opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]',
      className
    )}
  >
    <Link
      href={url}
      target={target}
      className={cn(
        `
          group/announcement
          relative
          flex flex-row
          items-center
          p-1 pr-3
          text-sm
          w-auto
          gap-2
          text-left
          rounded-full
          bg-opacity-20
          border
          border-background-surface-300
          hover:border-foreground-muted
          hover:border-opacity-30
          shadow-md
          overflow-hidden
          focus-visible:outline-none focus-visible:ring-brand-600 focus-visible:ring-2 focus-visible:rounded-full
          `,
        !badge && 'px-4'
      )}
    >
      {badge && (
        <Badge variant="brand" size="large" className="py-1">
          {badge}
        </Badge>
      )}
      <span className="text-foreground">{announcement}</span>
      {hasArrow && (
        <ArrowNarrowRightIcon className="h-4 ml-2 -translate-x-1 text-foreground transition-transform group-hover/announcement:translate-x-0" />
      )}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br
            opacity-70
            group-hover/announcement:opacity-100
            transition-opacity
            overflow-hidden rounded-full
            from-background-surface-100
            to-background-surface-300
            backdrop-blur-md
            "
      />
    </Link>
  </div>
)

export default AnnouncementBadge
