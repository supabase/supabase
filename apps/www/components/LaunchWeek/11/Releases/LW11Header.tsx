import React from 'react'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LW11Background from '../LW11Background'
import Image from 'next/image'
import Link from 'next/link'

const LW11Header = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative w-full overflow-visible pt-10 sm:pt-8', className)}>
      <SectionContainer className="h-full flex flex-col items-start gap-4 !max-w-none lg:!container !pb-4 md:!pb-10">
        <Image
          src="/images/launchweek/ga/ga-black.svg"
          alt="GA logo"
          className="dark:hidden w-20 md:w-24 aspect-[104/57] h-auto"
          priority
          quality={100}
          width={300}
          height={300}
        />
        <Image
          src="/images/launchweek/ga/ga-white.svg"
          alt="GA logo"
          className="hidden dark:block w-20 md:w-24 aspect-[104/57] h-auto"
          priority
          quality={100}
          width={300}
          height={300}
        />
        <p className="text-foreground-lighter text-xl md:text-2xl max-w-2xl">
          Supabase is{' '}
          <strong className="text-foreground font-normal">
            officially launching into General Availability
          </strong>
          . <br className="hidden sm:block" /> Join us in this major milestone and explore{' '}
          <br className="hidden sm:block" /> the exciting features that come with it.
        </p>
        <Button asChild size="small" type="alternative">
          <Link href="/ga">Read full announcement</Link>
        </Button>
      </SectionContainer>
      <div className="absolute z-0 inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute z-0 inset-0 w-full aspect-video">
          <LW11Background className="absolute z-0 inset-0 w-full flex items-center justify-center opacity-100 transition-opacity h-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#060809)_0%,transparent_100%)]" />
      </div>
    </div>
  )
}

export default LW11Header
