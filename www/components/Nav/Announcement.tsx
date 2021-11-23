import React from 'react'
import Link from 'next/link'

import announcement from '~/data/Announcement.json'
import { IconChevronRight, Button, IconX } from '@supabase/ui'

const Announcement = () => {
  if (!announcement.show) return null
  return (
    <Link href={announcement.link}>
      <div
        className="
          relative
          cursor-pointer
          bg-gradient-to-r from-green-400 to-green-600
          hover:from-green-500 hover:to-green-700        
          text-white 
          flex flex-row space-x-3
        "
      >
        <div
          className="
            flex items-center justify-center p-3 mx-auto text-sm lg:container lg:px-16 xl:px-20 font-medium 
            lg:divide-x divide-green-400
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
        <div className="transition-opacity absolute right-4 h-full flex items-center opacity-50 hover:opacity-100">
          <IconX size={16} />
        </div>
      </div>
    </Link>
  )
}

export default Announcement
