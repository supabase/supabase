import React, { useEffect, useState } from 'react'

import _announcement from '~/data/Announcement.json'
import { IconChevronRight, IconX } from '@supabase/ui'
import { useRouter } from 'next/router'

interface AnnouncementProps {
  show: boolean
  text: string
  cta: string
  link: string
  badge?: string
}

const announcement = _announcement as AnnouncementProps

const Announcement = () => {
  const [hidden, setHidden] = useState(true)

  const router = useRouter()

  // override to hide announcement
  if (!announcement.show) return null

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

  function handleLink() {
    router.push(announcement.link)
    window.localStorage.setItem(announcementKey, 'hidden')
  }

  if (hidden) {
    return null
  } else {
    return (
      <div
        onClick={handleLink}
        className="
          launch-week-gradientBg--anouncement-bar
          to-green-1000
          hover:from-green-1000
          hover:to-green-1100 relative flex
          cursor-pointer flex-row        
          space-x-3 
          overflow-hidden bg-gradient-to-r from-green-900
          text-white
        "
      >
        <div
          className="
            mx-auto flex items-center justify-center divide-white p-3 text-sm font-medium lg:container lg:divide-x 
            lg:px-16 xl:px-20
          "
        >
          <span className="item-center flex gap-2 px-3">
            {announcement.badge && (
              <div className="bg-brand-400 text-brand-900 py-0.25 rounded px-1.5">
                {announcement.badge}
              </div>
            )}
            <span>{announcement.text}</span>
          </span>
          <span className="hidden items-center space-x-2 px-3 lg:flex">
            <span>{announcement.cta}</span>
            <IconChevronRight size={14} />
          </span>
        </div>
        <div
          className="absolute right-4 flex h-full items-center opacity-50 transition-opacity hover:opacity-100"
          onClick={handleClose}
        >
          <IconX size={16} />
        </div>
      </div>
    )
  }
}

export default Announcement
