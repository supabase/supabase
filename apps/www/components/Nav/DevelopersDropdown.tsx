import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronRight } from 'ui'

import Announcements from '~/data/Announcements.json'
import { data as DevelopersData } from 'data/Developers'

type Props = {
  text: string
  description?: string
  url?: string
  icon?: string
  svg?: any
}

const DevelopersDropdown = () => {
  const { basePath } = useRouter()
  const iconsWithFill = ['GitHub Discussions', 'Launch Week']

  return (
    <>
      <div className="flex">
        <div className="w-[500px] p-6 border-r grid gap-3 grid-cols-2">
          {DevelopersData['navigation'].map((column) => (
            <div key={column.label} className="p-2 flex flex-col gap-6">
              <label className="text-muted text-xs uppercase tracking-widest font-mono">
                {column.label}
              </label>
              <ul className="flex flex-col gap-6">
                {column.links.map((link: Props) => (
                  <li key={link.text}>
                    <Link href={link.url!}>
                      <a className="flex group items-center gap-2 text-light hover:text-brand focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            {...(iconsWithFill.includes(link.text)
                              ? {
                                  fillRule: 'evenodd',
                                  clipRule: 'evenodd',
                                  fill: 'currentColor',
                                }
                              : {
                                  stroke: 'currentColor',
                                  strokeMiterlimit: '10',
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                })}
                            d={link.icon}
                          />
                        </svg>
                        <span>{link.text}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col w-[500px] bg-alternative">
          <div className="flex-col gap-3 p-6">
            <Link href="/blog">
              <a className="inline-flex items-center gap-1 text-muted hover:text-brand text-xs uppercase tracking-widest font-mono mb-6">
                Blog
                <IconChevronRight className="h-3 w-3" />
              </a>
            </Link>
            <ul className="flex flex-col gap-4">
              {Announcements.map((announcement: any) => (
                <li key={announcement.title}>
                  <Link href={announcement.url}>
                    <a className="group flex items-center gap-3 text-lighter">
                      <div className="relative rounded-md border h-20 w-32 flex-shrink-0 overflow-auto">
                        <Image
                          src={`${basePath}${announcement?.imgUrl}`}
                          alt="launch week 8"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-strong mb-0 line-clamp-2 group-hover:text-brand">
                          {announcement.title}
                        </p>
                        <p className="line-clamp-2 text-sm !mb-0 group-hover:text-light">
                          {announcement.description}
                        </p>
                      </div>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export default DevelopersDropdown
