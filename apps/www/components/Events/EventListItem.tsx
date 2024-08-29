import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import type Author from '~/types/author'
import type PostTypes from '~/types/post'
import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

interface Props {
  event: PostTypes
}

const EventListItem = ({ event }: Props) => {
  const authorArray: string[] | undefined = event?.author ? event.author.split(',') : []
  const author = []

  if (authorArray) {
    for (let i = 0; i < authorArray.length; i++) {
      author.push(
        authors.find((authors: Author) => {
          return authors.author_id === authorArray[i]
        })
      )
    }
  }

  return (
    <Link
      href={event.path}
      className="group flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b"
    >
      <div className="flex w-full lg:col-span-8 xl:col-span-8">
        <h3 className="text-foreground text-lg group-hover:underline">{event.title}</h3>
      </div>
      <div className="lg:col-span-2 xl:col-span-4 flex justify-start items-center lg:grid grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
        {/* <div className="hidden lg:flex items-center -space-x-2">
          {author.map((author: any, i: number) => {
            return (
              <div className="relative ring-background w-6 h-6 rounded-full ring-2" key={i}>
                {author.author_image_url && (
                  <Image
                    src={author.author_image_url}
                    className="rounded-full object-cover border border-default w-full h-full"
                    alt={`${author.author} avatar`}
                    fill
                  />
                )}
              </div>
            )
          })}
        </div> */}
        {event.categories && (
          <div className="hidden xl:flex text-foreground-lighter group-hover:text-foreground-light">
            {event.categories.map(
              (category, i) =>
                i === 0 && (
                  <span
                    key={category}
                    className="text-sm border border-muted group-hover:border-foreground-muted py-1 px-3 rounded-full text-center w-auto capitalize"
                  >
                    {category}
                  </span>
                )
            )}
          </div>
        )}
        {event.date && (
          <p className="text-foreground-lighter group-hover:text-foreground-light min-w-40 flex-1 lg:text-right w-full">
            {dayjs(event.date)
              .tz(event.timezone ?? 'America/Los_Angeles')
              .format('D MMM YYYY | hA z')}
          </p>
        )}
      </div>
    </Link>
  )
}

export default EventListItem
