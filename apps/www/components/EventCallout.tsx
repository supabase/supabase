import React, { PropsWithChildren } from 'react'
import Link from 'next/link'
import { TextLink } from 'ui'
import SectionContainer from './Layouts/SectionContainer'
import Panel from './Panel'

interface Props {
  className?: string
}

const EventCallout = ({ className, ...props }: PropsWithChildren<Props>) => (
  <SectionContainer id="webinar" className={className} {...props}>
    <Link href="/events/scale-to-millions" className="w-full">
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

          <h1 className="text-foreground text-3xl">Scale to Millions</h1>
          <p>
            Quickly and cost effectively build Generative AI applications that you can use to chat
            with your company’s documents.
          </p>
          <TextLink label="Register now" />
        </div>
      </Panel>
    </Link>
  </SectionContainer>
)

export default EventCallout
