import React, { useEffect, useState } from 'react'

import announcement from '~/data/Announcement.json'
import { IconChevronRight, IconX } from '@supabase/ui'
import { useRouter } from 'next/router'

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
          to-green-1000
          hover:from-green-1000
          hover:to-green-1100 relative flex
          cursor-pointer flex-row        
          space-x-3 
          bg-gradient-to-r from-green-900 text-white
        "
      >
        <div
          className="
            mx-auto flex items-center justify-center divide-white p-3 text-sm font-medium lg:container lg:divide-x 
            lg:px-16 xl:px-20
          "
        >
          <span className="hidden px-3 lg:block">{announcement.text}</span>
          <span className="flex items-center space-x-2 px-3">
            <span>
              {
                // @ts-ignore
                announcement.cta
              }
            </span>
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
