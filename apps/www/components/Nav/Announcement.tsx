import React, { useEffect, useState } from 'react'

import _announcement from '~/data/Announcement.json'
import { IconChevronRight, IconX } from 'ui'
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
          launch-week-gradientBg--announcement-bar
          to-green-1000
          hover:from-green-1000
          hover:to-green-1100 relative flex
          cursor-pointer flex-row
          space-x-3
          overflow-hidden
          text-white
        "
      >
        <div
          className="
            mx-auto flex items-center gap-6 justify-center p-3 text-sm font-medium lg:container
            lg:px-16 xl:px-20
          "
        >
          <span>{announcement.text}</span>
          <span className="item-center flex gap-2 pr-8 sm:px-3">
            {announcement.badge && (
              <div className="bg-[#2E2E2E] text-white py-0.25 rounded-2xl px-3 py-1 border border-gray-1100	whitespace-nowrap">
                {announcement.badge}
              </div>
            )}
          </span>
          <span className="hidden items-center space-x-2 px-3 lg:flex">
            <span>{announcement.cta}</span>
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
