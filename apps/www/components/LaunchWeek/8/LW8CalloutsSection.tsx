import React from 'react'
import SectionContainer from '../../Layouts/SectionContainer'
import { SmallCard } from '../8/Releases/components'
import Link from 'next/link'
import Image from 'next/image'

const LW8CalloutsSection = () => {
  return (
    <SectionContainer className="!py-0 w-full !px-0 !max-w-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-[105px]" id="hackathon">
        <SmallCard className="hover:from-background-surface-300 hover:to-background-surface-300">
          <Link href="/blog/supabase-lw8-hackathon">
            <a className="flex flex-row justify-between items-center w-full h-full">
              <div className="relative flex-shrink flex items-center p-2 w-1/2 md:w-auto">
                <div className="flex flex-col gap-1 pl-4">
                  <span className="text-white">Join us daily at Twitter Spaces </span>
                  <span className="">Next up: Monday – Opening Day</span>
                </div>
              </div>
              <div className="relative flex !aspect-video h-[80px] md:h-[100px] gap-2 z-10 rounded overflow-hidden">
                <Image
                  src="/images/launchweek/8/twitter-spaces-preview.png"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </a>
          </Link>
        </SmallCard>
        <SmallCard className="hover:from-background-surface-300 hover:to-background-surface-300">
          <Link href="/blog/supabase-lw8-hackathon">
            <a className="flex flex-row justify-between items-center w-full h-full">
              <div className="relative h-full flex-shrink flex flex-col md:flex-row md:items-center p-2 w-1/2 md:w-auto gap-1 md:gap-4">
                <div className="flex flex-col gap-1 pl-4">
                  <span className="text-white">LW8 Hackathon Aug 4 – Aug 13</span>
                  <span className="">Read more about rules and prizes on the blog</span>
                </div>
              </div>
              <div className="relative flex !aspect-video h-[80px] md:h-[100px] gap-2 z-10 rounded overflow-hidden">
                <Image
                  src="/images/launchweek/8/twitter-spaces-preview.png"
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
