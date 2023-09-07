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
                      <a className="flex items-center gap-2 text-light hover:text-brand focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong">
                        <svg
                          className="h-5 w-5 text-brand"
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
                        <p className="line-clamp-1 text-xs !mb-0">{announcement.description}</p>
                      </div>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* <div className="p-4 flex justify-between bg-alternative text-sm">
        <Link href={DevelopersData['footer']['support'].url}>
          <a className="p-2 hover:bg-[#101010] rounded text-foreground-light flex items-center gap-1 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.6 7.00039C12.6 10.0932 10.0928 12.6004 7.00002 12.6004C3.90723 12.6004 1.40002 10.0932 1.40002 7.00039C1.40002 3.9076 3.90723 1.40039 7.00002 1.40039C10.0928 1.40039 12.6 3.9076 12.6 7.00039ZM7.70003 9.80039C7.70003 10.187 7.38662 10.5004 7.00002 10.5004C6.61343 10.5004 6.30002 10.187 6.30002 9.80039C6.30002 9.41379 6.61343 9.10039 7.00002 9.10039C7.38662 9.10039 7.70003 9.41379 7.70003 9.80039ZM7.00002 3.50039C6.61343 3.50039 6.30002 3.81379 6.30002 4.20039V7.00039C6.30002 7.38699 6.61343 7.70039 7.00002 7.70039C7.38662 7.70039 7.70002 7.38699 7.70002 7.00039V4.20039C7.70002 3.81379 7.38662 3.50039 7.00002 3.50039Z"
                fill="#707070"
              />
            </svg>
            <span>{DevelopersData['footer']['support'].text}</span>
          </a>
        </Link>
        <Link href={DevelopersData['footer']['systemStatus'].url}>
          <a className="p-2 hover:bg-[#101010] rounded text-foreground-light focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong">
            {DevelopersData['footer']['systemStatus'].text}
          </a>
        </Link>
      </div> */}
    </>
  )
}

export default DevelopersDropdown
