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
      <div className="flex w-full lg:col-span-7 xl:col-span-8">
        <h3 className="text-foreground text-lg group-hover:underline">{event.title}</h3>
      </div>
      <div className="lg:col-span-3 xl:col-span-4 flex justify-between items-center grid-cols-2 gap-2 text-sm">
        {event.categories && (
          <div className="hidden xl:flex gap-2 text-foreground-lighter group-hover:text-foreground-light">
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
        {event.date && <EventDate event={event} />}
      </div>
    </Link>
  )
}

const EventDate: React.FC<{ event: PostTypes }> = ({ event }) => {
  const parsedDate = dayjs.utc(event.date)

  /**
   * If meetups, show absolute time + timezone
   * otherwise show time based on timezone
   * */
  const formattedDate = event.categories?.includes('meetup')
    ? parsedDate
        .tz('Europe/London')
        .format(`DD MMM YY, h${parsedDate.get('minutes') > 0 ? ':mmA' : 'A'}`)
    : parsedDate.tz(event.timezone).format(`DD MMM YY, h:mmA`)

  return (
    <p className="text-foreground-lighter font-mono text-xs lg:text-left lg:w-[240px] text-nowrap group-hover:text-foreground-light min-w-20 inline-flex items-center lg:justify-start gap-1.5 w-full leading-relaxed">
      {formattedDate}
      <span className="min-w-px h-[16px] mx-1 bg-foreground-muted/50" />
      {parsedDate.tz(event.timezone).format(' z')}
    </p>
  )
}

export default EventListItem
