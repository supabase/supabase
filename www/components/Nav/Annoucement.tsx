import React from 'react'
import { IconArrowRight } from '@supabase/ui'

import data from '~/data/Annoucement.json';

type A = {
  show: boolean;
  text: string;
  link: {
    text: string;
    url: string;
  }
}

const a: A = data;

const Annoucement = () => {
  if (!a.show) return (null)
  return (
    <div className="bg-brand-700 dark:bg-gray-700">
      <div className="flex flex-col items-center justify-center py-2 mx-auto space-x-2 text-white sm:flex-row lg:container lg:px-16 xl:px-20">
        <span>{a.text}</span>
        <a
          href={a.link.url}
          className="inline-flex items-center px-2 py-1 space-x-1 text-xs transition-colors bg-white dark:bg-brand-800 rounded-full text-brand-800 hover:text-brand-800 dark:text-white hover:bg-opacity-90 dark:hover:bg-brand-700"
        >
          {a.link.text} <IconArrowRight size="tiny" />
        </a>
      </div>
    </div>
  )
}

export default Annoucement
