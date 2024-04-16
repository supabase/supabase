import React from 'react'
import { cn } from 'ui'
import LabelBadge from './LabelBadge'
import LaunchWeekPrizeCard from './LaunchWeekPrizeCard'
import Image from 'next/image'
import PrizeActions from './Releases/PrizeActions'

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
      <p className="text-2xl text-foreground-lighter">Generate your ticket for a chance to win.</p>
      <div className="w-full pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto h-auto text-foreground">
          <LaunchWeekPrizeCard
            className="col-span-full md:col-span-2"
            contentClassName="flex flex-col justify-between"
            content={
              <div className="w-full h-auto lg:min-h-[400px] flex flex-col lg:flex-row items-stretch rounded-lg overflow-hidden">
                <div className="relative w-full pl-4 xl:px-4 lg:w-2/3 border-b lg:border-none border-muted aspect-[3/1] top-0 md:-bottom-8 overflow-hidden">
                  <Image
                    src="/images/launchweek/11/airpods-max-alpha.png"
                    alt="Supabase AirPod Max prize"
                    draggable={false}
                    width={300}
                    height={300}
                    className="hidden md:block absolute object-cover scale-50 lg:scale-100 lg:object-top w-[90%] h-full opacity-90 dark:opacity-50 pointer-events-none"
                  />
                  <Image
                    src="/images/launchweek/11/airpods-max-alpha-crop.png"
                    alt="Supabase AirPod Max prize"
                    draggable={false}
                    width={300}
                    height={300}
                    className="md:hidden absolute mx-auto object-cover inset-x-0 lg:object-top w-auto h-full opacity-90 dark:opacity-50 pointer-events-none"
                  />
                </div>
                <div className="flex flex-col lg:w-1/2 gap-1 p-4 md:p-8 lg:pl-0 lg:h-full">
                  <div className="flex flex-col gap-2 flex-grow">
                    <LabelBadge text="5 sets" />
                    <p className="xl:mt-4 text-foreground">Win AirPods Max</p>
                    <p className="text-foreground-lighter text-sm">
                      Secure your ticket to enter our random prize pool, and amplify your odds by
                      sharing. Or if you don't leave anything up for chance - join our Hackathon and
                      showcase your creations. With luck or skill, you could snag these top-tier
                      headphones!
                    </p>
                  </div>
                  <div className="w-full mt-3 md:mt-6">
                    <PrizeActions />
                  </div>
                </div>
              </div>
            }
          />
          <div className="w-full flex flex-col gap-4 items-stretch">
            <LaunchWeekPrizeCard
              className="flex-grow"
              content={
                <div className="p-4 md:p-6 flex flex-col gap-2 text-sm items-start justify-between h-full">
                  <LabelBadge text="30 t-shirts" />
                  <p>Supabase T-shirts</p>
                </div>
              }
            />
            <LaunchWeekPrizeCard
              className="flex-grow"
              content={
                <div className="p-4 md:p-6 flex flex-col gap-2 text-sm items-start justify-between h-full">
                  <LabelBadge text="25 pins" />
                  <p>Supabase Pins</p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
