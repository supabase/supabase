import React from 'react'
import { cn } from 'ui'
import LabelBadge from './LabelBadge'
import LaunchWeekPrizeCard from './LaunchWeekPrizeCard'
import Image from 'next/image'

export default function LaunchWeekPrizeSection({ className }: { className?: string }) {
  return (
    <div
      id="prizes"
      className={cn(
        'relative text-left flex flex-col max-w-7xl mx-auto gap-2 scroll-mt-[66px] text-foreground-lighter',
        className
      )}
    >
      <h2 className="w-full text-sm font-mono uppercase tracking-[1px]">Awards</h2>
      <div className="w-full pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto h-auto text-foreground">
          <LaunchWeekPrizeCard
            className="col-span-full md:col-span-2"
            contentClassName="flex flex-col justify-between"
            content={
              <>
                <div className="p-4 md:p-6 flex flex-col flex-shrink gap-2 text-sm items-start">
                  <LabelBadge text="10 keyboards" />
                  <p className="text-lg text-foreground-lighter max-w-lg">
                    Increase your chances of winning a limited-edition{' '}
                    <span className="text-foreground">62-Key ISO Mechanical Keyboard</span> by
                    sharing your ticket on X and LinkedIn.
                  </p>
                </div>
                <div className="px-4 mt-10 w-full">
                  <div className="relative w-full aspect-[3.078/1]">
                    <Image
                      src="/images/launchweek/lwx/swag/lwx_keyboard.png"
                      fill
                      quality={100}
                      alt="/images/launchweek/lwx/swag/lwx_keyboard.png"
                      className="h-full w-full block"
                    />
                  </div>
                </div>
              </>
            }
          />
          <div className="w-full flex flex-col gap-4 items-stretch">
            <LaunchWeekPrizeCard
              className="flex-grow"
              content={
                <div className="p-4 md:p-6 flex flex-col gap-2 text-sm items-start justify-between h-full">
                  <LabelBadge text="20 t-shirts" />
                  Launch Week X T-Shirt
                </div>
              }
            />
            <LaunchWeekPrizeCard
              className="flex-grow"
              content={
                <div className="p-4 md:p-6 flex flex-col gap-2 text-sm items-start justify-between h-full">
                  <LabelBadge text="25 caps" />
                  Launch Week X Cap
                </div>
              }
            />
            <LaunchWeekPrizeCard
              className="flex-grow"
              content={
                <div className="p-4 md:p-6 flex flex-col gap-2 text-sm items-start justify-between h-full">
                  <LabelBadge text="50 stickers" />
                  <p>Launch Week X Stickers</p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
