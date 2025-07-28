'use client'

import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils/cn'
import { X } from 'lucide-react'

export interface AnnouncementProps {
  show: boolean
  text: string
  launchDate: string
  link: string
  badge?: string
}

interface AnnouncementComponentProps {
  show?: boolean
  dismissable?: boolean
  className?: string
  announcementKey: `announcement_${string}`
}

const Announcement = ({
  show = true,
  dismissable = true,
  className,
  children,
  announcementKey,
}: PropsWithChildren<AnnouncementComponentProps>) => {
  const [hidden, setHidden] = useState(true)

  const pathname = usePathname()
  const isLaunchWeekSection = pathname?.includes('launch-week') ?? false

  // override to hide announcement
  if (!show) return null

  // construct the key for the announcement, based on the title text
  const announcementKeyNoSpaces = announcementKey.replace(/ /g, '')

  // window.localStorage is kept inside useEffect
  // to prevent error
  useEffect(function () {
    if (window.localStorage.getItem(announcementKeyNoSpaces) === 'hidden') {
      setHidden(true)
    }

    if (!window.localStorage.getItem(announcementKeyNoSpaces)) {
      setHidden(false)
    }
  }, [])

  function handleClose(event: any) {
    event.stopPropagation()

    window.localStorage.setItem(announcementKeyNoSpaces, 'hidden')
    return setHidden(true)
  }

  if (!isLaunchWeekSection && hidden) {
    return null
  } else {
    return (
      <div className={cn('relative z-40 w-full', className)}>
        {dismissable && !isLaunchWeekSection && (
          <div
            className="absolute z-50 right-4 flex h-full items-center opacity-100 text-foreground transition-opacity hover:opacity-100"
            onClick={handleClose}
          >
            <X size={16} />
          </div>
        )}
        {children}
      </div>
    )
  }
}

export default Announcement
