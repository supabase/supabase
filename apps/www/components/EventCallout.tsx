import React, { PropsWithChildren } from 'react'
import Link from 'next/link'
import { cn, TextLink } from 'ui'
import Panel from './Panel'
import { ChevronRightIcon, VideoCameraIcon } from '@heroicons/react/solid'

interface Props {
  className?: string
  size?: 'tiny' | 'small' | 'large'
}

const EVENT_LINK = '/events/scale-to-billions-generative-ai-humata'

const EventCallout = ({ className, size = 'tiny', ...props }: PropsWithChildren<Props>) => {
  switch (size) {
    case 'tiny':
      return (
        <Link
          href={EVENT_LINK}
          className={cn(
            'group flex items-center flex-wrap text-sm text-foreground-light hover:text-foreground transition-opacity',
            className
          )}
          {...props}
        >
          <span className="py-1 uppercase text-brand font-mono">Webinar</span>
          <span className="py-1 uppercase mx-3 px-3 border-x">21 Aug</span>
          <span className="py-1">Scale to Billions: Generative AI/Humata</span>
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
          <span className="py-1 uppercase text-brand font-mono">Upcoming Webinar</span>
          <span className="py-1 uppercase mx-3 px-3 border-x">21 Aug</span>
          <span className="py-1">Scale to Billions: Generative AI/Humata</span>
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
                <span className="mx-3 pl-3 border-l">21 Aug 2024 at 8PM PST</span>
              </div>

              <span className="text-foreground text-3xl">Scale to Billions</span>
              <p>
                Quickly and cost effectively build Generative AI applications that you can use to
                chat with your company’s documents.
              </p>
              <TextLink label="Register now" />
            </div>
          </Panel>
        </Link>
      )
  }
}

export default EventCallout
