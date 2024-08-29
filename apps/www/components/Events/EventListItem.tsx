import authors from 'lib/authors.json'
import Link from 'next/link'
import React from 'react'
import type Author from '~/types/author'
import type PostTypes from '~/types/post'
import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { Badge } from 'ui'

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
      href={event.disable_page_build ? event.link?.href ?? '' : event.path}
      target={event.disable_page_build ? event.link?.target ?? '' : '_self'}
      className="group flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b"
    >
      <div className="flex w-full lg:col-span-8 xl:col-span-7">
        <h3 className="text-foreground text-lg group-hover:underline">{event.title}</h3>
      </div>
      <div className="lg:col-span-2 xl:col-span-5 flex justify-start items-center lg:grid grid-cols-2 xl:grid-cols-2 gap-2 text-sm">
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
          <div className="hidden xl:flex gap-2 text-foreground-lighter flex-grow group-hover:text-foreground-light">
            {event.onDemand && (
              <Badge className="group-hover:border-foreground-muted capitalize">On Demand</Badge>
            )}
            {event.categories.map(
              (category, i) =>
                i === 0 && (
                  <Badge key={category} className="group-hover:border-foreground-muted capitalize">
                    {category}
                  </Badge>
                )
            )}
          </div>
        )}
        {event.date && (
          <p className="text-foreground-lighter group-hover:text-foreground-light min-w-40 flex items-center gap-1.5 flex-1 w-full">
            {dayjs(event.date)
              .tz(event.timezone ?? 'America/Los_Angeles')
              .format('DD MMM YYYY')}
            <span className="w-px h-[16px] bg-muted" />
            {dayjs(event.date)
              .tz(event.timezone ?? 'America/Los_Angeles')
              .format('hA')}
            <span className="w-px h-[16px] bg-muted" />
            {dayjs(event.date)
              .tz(event.timezone ?? 'America/Los_Angeles')
              .format('z')}
          </p>
        )}
      </div>
    </Link>
  )
}

export default EventListItem
