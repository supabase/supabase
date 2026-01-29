import React from 'react'
// import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
// import type Author from '~/types/author'
import type PostTypes from '../../types/post'

import dayjs from 'dayjs'

interface Props {
  event: PostTypes
}

const EventGridItem = ({ event }: Props) => {
  // const authorArray: string[] | undefined = event.author ? event.author.split(',') : []
  // const author = []

  // if (authorArray) {
  //   for (let i = 0; i < authorArray.length; i++) {
  //     author.push(
  //       authors.find((authors: Author) => {
  //         return authors.author_id === authorArray[i]
  //       })
  //     )
  //   }
  // }

  return (
    <Link
      href={event.disable_page_build ? event.url : event.path}
      className="group inline-block min-w-full p-2 sm:p-4 h-full border border-transparent transition-all hover:bg-surface-200 dark:hover:bg-surface-75 rounded-xl"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1">
          <div className="border-default relative mb-3 w-full aspect-[2/1] lg:aspect-[5/3] overflow-hidden rounded-lg border shadow-sm">
            {!event.thumb ? (
              <div className="bg-background-alternative w-full h-full" />
            ) : (
              <Image
                fill
                sizes="100%"
                quality={100}
                src={
                  event.type === 'casestudy' ||
                  event.thumb.startsWith('/') ||
                  event.thumb.startsWith('http')
                    ? event.thumb
                    : `/images/blog/${event.thumb}`
                }
                className="scale-100 object-cover overflow-hidden"
                alt={`${event.title} thumbnail`}
              />
            )}
          </div>

          {event.date && (
            <div className="text-foreground-lighter flex items-center space-x-1.5 text-sm">
              <p>{dayjs(event.date).format('D MMM YYYY')}</p>
              {event.readingTime && (
                <>
                  <p>•</p>
                  <p>{event.readingTime}</p>
                </>
              )}
            </div>
          )}
          <h3 className="text-foreground max-w-sm text-xl">{event.title}</h3>
          <p className="text-foreground-light max-w-sm text-base !mb-0">{event.description}</p>
        </div>
      </div>
    </Link>
  )
}

export default EventGridItem
