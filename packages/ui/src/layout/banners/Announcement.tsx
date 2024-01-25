import { useEffect, useState } from 'react'

import _announcement from './data/Announcement.json'
import { IconX, cn } from 'ui'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

export interface AnnouncementProps {
  show: boolean
  text: string
  launchDate: string
  link: string
  badge?: string
}

const announcement = _announcement as AnnouncementProps

interface AnnouncementComponentProps {
  show?: boolean
  dismissable?: boolean
  className?: string
}

const Announcement = ({
  show = true,
  dismissable = true,
  className,
  children,
}: PropsWithChildren<AnnouncementComponentProps>) => {
  const [hidden, setHidden] = useState(false)

  const router = useRouter()
  const isLaunchWeekSection = router.pathname.includes('launch-week')

  // override to hide announcement
  if (!show || !announcement.show) return null

  // construct the key for the announcement, based on the title text
  const announcementKey = 'announcement_' + announcement.text.replace(/ /g, '')

  // window.localStorage is kept inside useEffect
  // to prevent error
  useEffect(function () {
    if (!window.localStorage.getItem(announcementKey)) {
      return setHidden(false)
    }
  }, [])

  function handleClose(event: any) {
    event.stopPropagation()

    window.localStorage.setItem(announcementKey, 'hidden')
    return setHidden(true)
  }

  // Always show if on LW section
  if (!isLaunchWeekSection && hidden) {
    return null
  } else {
    return (
      <div className={cn('relative z-40 w-full', className)}>
        {dismissable && !isLaunchWeekSection && (
          <div
            className="absolute z-50 right-4 flex h-full items-center opacity-100 text-white transition-opacity hover:opacity-100"
            onClick={handleClose}
          >
            <IconX size={16} />
          </div>
        )}
        {children}
      </div>
    )
  }
}

export default Announcement
