import React from 'react'
import Link from 'next/link'
import { Badge } from 'ui'
import { ArrowNarrowRightIcon } from '@heroicons/react/outline'

const AnnouncementBadge = () => (
  <div className="w-full max-w-xl flex justify-center opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]">
    <Link href="/launch-week">
      <a
        className="
          group
          relative
          flex flex-row
          items-center
          pr-3 p-1
          text-sm
          w-auto
          gap-2
          text-left
          rounded-full
          bg-opacity-20
          border
          border-background-surface-100
          hover:border-background-surface-300
          overflow-hidden
          focus:outline-none focus:ring-brand-600 focus:ring-2 focus:rounded-full
          "
      >
        <Badge color="brand" size="large" className="py-1">
          Explore
        </Badge>
        <span className="text-foreground">Launch Week 8 announcements</span>
        <ArrowNarrowRightIcon className="h-4 ml-2 -translate-x-1 transition-transform group-hover:translate-x-0" />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br
            opacity-70
            overflow-hidden rounded-full
            from-background-surface-100
            to-background-surface-300
            backdrop-blur-md
            "
        />
      </a>
    </Link>
  </div>
)

export default AnnouncementBadge
