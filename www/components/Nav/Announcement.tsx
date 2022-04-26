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
          relative
          cursor-pointer
          bg-gradient-to-r from-green-900 to-green-1000
          hover:from-green-1000 hover:to-green-1100        
          text-white 
          flex flex-row space-x-3
        "
      >
        <div
          className="
            flex items-center justify-center p-3 mx-auto text-sm lg:container lg:px-16 xl:px-20 font-medium 
            lg:divide-x divide-white
          "
        >
          <span className="px-3 hidden lg:block">{announcement.text}</span>
          <span className="px-3 flex items-center space-x-2">
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
          className="transition-opacity absolute right-4 h-full flex items-center opacity-50 hover:opacity-100"
          onClick={handleClose}
        >
          <IconX size={16} />
        </div>
      </div>
    )
  }
}

export default Announcement
