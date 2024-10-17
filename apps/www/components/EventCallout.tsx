import React, { PropsWithChildren } from 'react'
import Link from 'next/link'
import { cn, TextLink } from 'ui'
import Panel from './Panel'
import { ChevronRightIcon, VideoCameraIcon } from '@heroicons/react/solid'

interface Props {
  className?: string
  size?: 'tiny' | 'small' | 'large'
}

const EVENT_LINK = '/events/scale-to-millions-goodtape-auth'

const EventCallout = ({ className, size = 'tiny', ...props }: PropsWithChildren<Props>) => {
  switch (size) {
    case 'tiny':
      return (
        <Link
          href={EVENT_LINK}
          className={cn(
            'group flex items-center flex-wrap text-sm text-foreground-light hover:text-foreground transition-opacity gap-y-0.5 gap-x-2 md:gap-2',
            className
          )}
          {...props}
        >
          <span className="uppercase text-brand font-mono">Webinar</span>
          {/* <span className="uppercase px-2 text-xs">23 Oct</span> */}
          <span className="">Migrating to Supabase Auth / Good Tape</span>
          <ChevronRightIcon className="translate-x-0 transition-transform group-hover:translate-x-0.5 w-3 h-3 -ml-1" />
        </Link>
      )
    case 'small':
      return (
        <Link
          href={EVENT_LINK}
          className={cn(
            'group flex items-center flex-wrap text-sm text-foreground-light hover:text-foreground transition-opacity',
            className
          )}
          {...props}
        >
          <VideoCameraIcon className="w-4 h-4 text-brand mr-2" />
          <span className="py-1 uppercase text-brand font-mono">Webinar</span>
          <span className="py-1 uppercase mx-3 px-3 border-x">23 Oct</span>
          <span className="py-1">Migrating to Supabase Auth / Good Tape</span>
          <ChevronRightIcon className="translate-x-0 transition-transform group-hover:translate-x-0.5 w-3 h-3 ml-1.5" />
        </Link>
      )
    case 'large':
      return (
        <Link href={EVENT_LINK} className={cn('w-full', className)} {...props}>
          <Panel
            outerClassName="w-full"
            innerClassName="relative p-4 lg:p-8 h-full flex flex-col md:flex-row gap-4 md:gap-8"
          >
            <div className="relative h-52 lg:h-44 xl:h-52 aspect-[2/1] md:!aspect-[3/2] rounded-lg border">
              {/* <Image
              src=""
              fill
              sizes="100%"
              quality={100}
              className="object-cover"
              alt="event thumbnail"
            /> */}
            </div>
            <div className="flex flex-col gap-2 md:gap-3 flex-grow max-w-xl xl:justify-center">
              <div className="flex flex-row text-sm">
                <span className="uppercase text-brand font-mono">Webinar</span>
                <span className="mx-3 pl-3 border-l">23 Oct 2024 at 10AM PST</span>
              </div>

              <span className="text-foreground text-3xl">Scale to Millions</span>
              <p>Learn how to reduce costs while maintaining top-tier security with Supabase</p>
              <TextLink label="Register now" />
            </div>
          </Panel>
        </Link>
      )
  }
}

export default EventCallout
