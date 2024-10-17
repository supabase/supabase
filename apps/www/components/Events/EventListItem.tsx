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
      className="group flex flex-col lg:grid lg:grid-cols-10 2xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b"
    >
      <div className="flex w-full lg:col-span-7 2xl:col-span-9">
        <h3 className="text-foreground text-lg group-hover:underline">{event.title}</h3>
      </div>
      <div className="lg:col-span-3 xl:col-span-3 flex justify-between items-center grid-cols-2 gap-2 text-sm">
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

const EventDate: React.FC<{ event: PostTypes }> = ({ event }) => (
  <p className="text-foreground-lighter lg:text-right flex-grow lg:w-full text-nowrap group-hover:text-foreground-light min-w-40 inline-flex items-center lg:justify-end gap-1.5 flex-1 w-full">
    {dayjs(event.date).tz(event.timezone).format('DD MMM YYYY')}
    <span className="min-w-px h-[16px] bg-muted" />
    <span className="">{dayjs(event.date).tz(event.timezone).format('hA')}</span>
    <span className="min-w-px h-[16px] bg-muted" />
    {dayjs(event.date).tz(event.timezone).format('z')}
  </p>
)

export default EventListItem
