import React from 'react'
import Link from 'next/link'
import { IconChevronRight } from 'ui'

import Announcements from '~/data/Announcements.json'
import { data as DevelopersData } from 'data/Developers'

type Props = {
  text: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

const DevelopersDropdown = () => (
  <div className="flex flex-col xl:flex-row">
    <div className="w-[550px] xl:w-[500px] py-8 px-8 bg-background grid gap-3 grid-cols-2">
      {DevelopersData['navigation'].map((column) => (
        <div key={column.label} className="p-0 flex flex-col gap-6">
          <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
            {column.label}
          </label>
          <ul className="flex flex-col gap-4">
            {column.links.map(({ icon: Icon, ...link }: Props) => (
              <li key={link.text}>
                <Link
                  href={link.url!}
                  className="flex group items-center gap-2 text-foreground-light text-sm hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded focus-visible:ring-foreground-lighter"
                >
                  {Icon && <Icon size={16} strokeWidth={1.2} />}
                  <span>{link.text}</span>
                  <IconChevronRight
                    strokeWidth={2}
                    className="w-3 -ml-1 transition-all will-change-transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="bg-overlay flex flex-col w-[550px] xl:w-[480px] border-t xl:border-t-0 xl:border-l">
      <div className="flex-col gap-2 py-8 px-10">
        <Link
          href="/blog"
          className="group flex items-center gap-1 text-foreground-lighter hover:text-foreground text-xs uppercase tracking-widest font-mono mb-5 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm focus-visible:text-foreground"
        >
          <span>Blog</span>
          <IconChevronRight className="h-3 w-3 transition-transform will-change-transform -translate-x-1 group-hover:translate-x-0" />
        </Link>
        <ul className="flex flex-col gap-5">
          {Announcements.map((announcement: any) => (
            <li key={announcement.title}>
              <Link
                href={announcement.url}
                className="group flex flex-col focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded"
              >
                <p className="text-foreground-light mb-0 line-clamp-2 group-hover:text-foreground group-focus-visible:text-foreground">
                  {announcement.title}
                </p>
                <p className="text-sm line-clamp-2 text-foreground-lighter leading-relaxed !mb-0 group-hover:text-foreground-light group-focus-visible:text-foreground-light">
                  {announcement.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)

export default DevelopersDropdown
