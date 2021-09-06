import React from 'react'
import { IconArrowRight } from '@supabase/ui'

import data from '~/data/Annoucement.json'

type A = {
  show: boolean
  text: string
  link: {
    text: string
    url: string
  }
}

const a: A = data

const Annoucement = () => {
  if (!a.show) return null
  return (
    <div className="bg-[#5865F2]">
      <div className="flex items-center justify-center py-2 mx-auto space-x-2 text-sm lg:container lg:px-16 xl:px-20 md:text-base">
        <span className="text-white">{a.text}</span>
        <a
          href={a.link.url}
          target="_blank"
          className="inline-flex items-center px-2 py-1 space-x-1 text-xs transition-colors rounded-lg text-[#5865F2] bg-white border border-transparent dark:hover:border-white dark:hover:bg-[#5865F2]"
        >
          <span>{a.link.text}</span>
          <IconArrowRight size="tiny" />
        </a>
      </div>
    </div>
  )
}

export default Annoucement
