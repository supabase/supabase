import React from 'react'
import LabelBadge from './LabelBadge'
import LaunchWeekPrizeCard from './LaunchWeekPrizeCard'
import Image from 'next/image'

export default function LaunchWeekPrizeSection({
  className,
  ticket,
}: {
  className?: string
  ticket?: any
}) {
  const Ticket = ticket

  return (
    <div id="lw8-prizes" className={['relative scroll-mt-[66px]', className].join(' ')}>
      <div className="absolute z-0 w-full aspect-[1.75/1] top-0 items-center justify-center">
        <Image
          src="/images/launchweek/8/swag-bg.png"
          alt="prizes background"
          fill
          sizes="100%"
          className="object-cover object-top"
          quality={100}
        />
      </div>
      <div className="!max-w-[100vw]">
        <div className="w-full container mx-auto h-px bg-gradient-to-r from-transparent via-border-control to-transparent" />
        <div className="text-center relative z-10 text-white">
          <div className="max-w-[38rem] mx-auto flex flex-col items-center gap-4 px-4">
            <div className="relative z-10 w-full h-[100px] md:h-[130px] rounded-sm flex mt-16 items-center justify-center">
              <Image
                src="/images/launchweek/8/swag-illustration.png"
                alt="prizes"
                fill
                sizes="100%"
                className="object-contain"
                quality={100}
              />
            </div>
            <h2 className="text-4xl">Swag has been delivered</h2>
          </div>
        </div>
        {ticket && <Ticket />}
        <div className="pt-8 lg:pt-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto h-auto text-white">
            <LaunchWeekPrizeCard
              className="col-span-full"
              imageUrl="/images/launchweek/8/swag/deskmat-lg.jpg"
              imageWrapperClassName="w-full aspect-[1.9/1] md:h-[300px]"
              content={
                <h3 className="w-full text-sm md:text-center flex md:justify-center items-center gap-4">
                  Supabase Desk Mat <LabelBadge text="10 mats" />
                </h3>
              }
              animateFrom="down"
            />
            <LaunchWeekPrizeCard
              imageUrl="/images/launchweek/8/swag/shirt.jpg"
              imageWrapperClassName="w-full aspect-[1.9/1]"
              imgObjectPosition="right"
              content={
                <h3 className="text-sm flex items-center gap-4">
                  Supabase T-Shirt <LabelBadge text="20 t-shirts" />
                </h3>
              }
              animateFrom="down"
            />
            <LaunchWeekPrizeCard
              imageUrl="/images/launchweek/8/swag/cap.jpg"
              imageWrapperClassName="w-full aspect-[1.9/1]"
              animateFrom="down"
              content={
                <h3 className="text-sm flex items-center gap-4">
                  Supabase Cap <LabelBadge text="25 caps" />
                </h3>
              }
            />
            <LaunchWeekPrizeCard
              imageUrl="/images/launchweek/8/swag/stickers.jpg"
              imageWrapperClassName="w-full aspect-[1.9/1]"
              animateFrom="down"
              content={
                <h3 className="text-sm flex items-center gap-4">
                  Supabase Sticker Pack <LabelBadge text="50 packs" />
                </h3>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
