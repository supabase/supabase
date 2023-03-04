import Image from 'next/image'
import React from 'react'
import LabelBadge from '../LabelBadge'
import LaunchWeekPrizeCard from './LaunchWeekPrizeCard'

export default function LaunchWeekPrizeSection() {
  return (
    <div>
      <div className="mt-8 relative h-[640px] overflow-hidden">
        <div className="-ml-[24rem] -mr-[24rem]">
          <Image src="/images/launchweek/seven/lw-7-bg.svg" layout="fill" objectFit="cover" />
        </div>
      </div>

      <div>
        <div className="text-center relative z-10 -mt-56 text-white bg-gradient-to-t from-[#1C1C1C] to-transparent">
          <div className="max-w-[38rem] mx-auto px-4">
            <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
            <h2 className="text-4xl mt-2">
              Get your <span className="gradient-text-purple-500">winning ticket</span>
            </h2>
            <p className="mt-4 radial-gradient-text-scale-500" id="lw-7-prizes">
              Mark your calendars for April 9th and join us on Discord for Launch Week 7's final day
              to find out if you're one of the lucky winners. Get sharing!
            </p>
          </div>
          <div className="bg-lw7-black-transition h-24"></div>
        </div>
        <div className="px-4 bg-scale-100">
          <div className="grid grid-cols-1 md:grid-cols-2 col-span-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto text-white">
            <LaunchWeekPrizeCard
              imageUrl="/images/launchweek/seven/keyboard.jpg"
              imageWrapperClassName="h-[40vw] lg:max-h-[360px]"
              className="col-span-2 lg:col-span-3"
              content={
                <>
                  <h3 className="gradient-text-purple-500 font-mono uppercase font-medium">
                    Main award
                  </h3>
                  <h4 className="flex items-center gap-3 text-[19px] mt-4">
                    <Image
                      src="/images/launchweek/seven/icons/compute-upgrade.svg"
                      width={16}
                      height={16}
                    />
                    Supabase Mechanical Keyboard <LabelBadge text="3 pieces" />
                  </h4>
                  <p className="text-[#707070] mt-1">
                    Increase your chances of winning limited edition 62-Key ISO Custom Mechanical
                    Keyboard by sharing your ticket on Twitter.
                  </p>
                </>
              }
            />

            <div className="col-span-2 grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LaunchWeekPrizeCard
                  imageUrl="/images/launchweek/seven/tshirt.jpg"
                  imageWrapperClassName="h-[40vw] md:h-[30vw] lg:max-h-[175px] lg:h-auto"
                  content={
                    <h3 className="text-sm flex items-center gap-4">
                      Supa T-shirt <LabelBadge text="10 shirts" />
                    </h3>
                  }
                />
                <LaunchWeekPrizeCard
                  imageUrl="/images/launchweek/seven/socks.jpg"
                  imageWrapperClassName="h-[40vw] md:h-[30vw] lg:max-h-[175px] lg:h-auto"
                  content={
                    <h3 className="text-sm flex items-center gap-4">
                      Supa Socks <LabelBadge text="5 pairs" />
                    </h3>
                  }
                />
              </div>
              <LaunchWeekPrizeCard
                imageUrl="/images/launchweek/seven/stickers.jpg"
                imageWrapperClassName="h-[40vw] lg:max-h-[175px] lg:h-auto"
                content={
                  <h3 className="text-sm flex items-center gap-4">
                    Launch Week 7 Limited Edition Sticker Pack <LabelBadge text="20 packs" />
                  </h3>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
