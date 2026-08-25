'use client'

import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Button, cn } from 'ui'

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

export const Announcement = ({
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
          <div className="absolute right-3 top-1/2 z-50 -translate-y-1/2 sm:right-4">
            <Button
              type="button"
              variant="text"
              size="tiny"
              icon={<X size={16} strokeWidth={1.5} />}
              aria-label="Dismiss announcement"
              onClick={handleClose}
              className="rounded-md bg-[#f8f3ef]/85 px-1 text-foreground-muted backdrop-blur-[2px] hover:bg-[#f8f3ef] hover:text-foreground dark:bg-[#0b0e0d]/85 dark:hover:bg-[#0b0e0d]"
            />
          </div>
        )}
        {children}
      </div>
    )
  }
}
