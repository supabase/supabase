import React from 'react'
import SectionContainer from '../../Layouts/SectionContainer'
import { SmallCard } from '../8/Releases/components'
import Link from 'next/link'
import Image from 'next/image'

const LW8CalloutsSection = () => {
  return (
    <SectionContainer className="!py-0 w-full !px-0 !max-w-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-[105px]" id="hackathon">
        <SmallCard className="hover:from-scale-900 hover:to-scale-900">
          <Link href="https://twitter.com/supabase/status/1688544202643111936">
            <a
              target="_blank"
              className="flex flex-row justify-between items-center w-full h-full gap-2"
            >
              <div className="relative flex-shrink flex items-center p-2 w-2/3 lg:w-1/2 md:w-auto">
                <div className="flex flex-col gap-1 sm:pl-4">
                  <span className="text-white">Twitter Spaces</span>
                  <span className="">Replay recordings</span>
                </div>
              </div>
              <div className="relative flex !aspect-video h-[80px] md:h-[100px] gap-2 z-10 rounded overflow-hidden">
                <Image
                  src="/images/launchweek/8/twitter-spaces-thumb.svg"
                  alt="twitter spaces thumbnail"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </a>
          </Link>
        </SmallCard>
        <SmallCard className="hover:from-scale-900 hover:to-scale-900">
          <Link href="/blog/supabase-lw8-hackathon">
            <a className="flex flex-row justify-between items-center w-full h-full gap-2">
              <div className="relative flex-shrink flex items-center p-2 w-2/3 lg:w-1/2 md:w-auto">
                <div className="flex flex-col gap-1 sm:pl-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white">LW8 Hackathon Aug 4 – Aug 13</span>
                  </div>
                  <span className="">Finished</span>
                </div>
              </div>
              <div className="relative flex !aspect-video h-[80px] md:h-[100px] gap-2 z-10 rounded overflow-hidden">
                <Image
                  src="/images/launchweek/8/lw8-hackathon-thumb.svg"
                  alt="hackathon thumbnail"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </a>
          </Link>
        </SmallCard>
      </div>
    </SectionContainer>
  )
}

export default LW8CalloutsSection
