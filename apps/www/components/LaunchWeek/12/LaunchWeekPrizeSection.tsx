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
      <div className="w-full pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto h-auto text-foreground">
          <LaunchWeekPrizeCard
            className="col-span-full md:col-span-2"
            contentClassName="flex flex-col justify-between"
            content={
              <div className="w-full h-auto lg:min-h-[400px] flex flex-col lg:flex-row items-stretch rounded-lg overflow-hidden">
                <div className="relative w-full pl-4 xl:px-4 lg:w-2/3 border-b lg:border-none border-muted aspect-[3/1] top-0 md:-bottom-8 overflow-hidden">
                  <Image
                    src="/images/launchweek/12/lw12-backpack.png"
                    alt="Supabase AirPod Max prize"
                    draggable={false}
                    width={300}
                    height={300}
                    quality={100}
                    className="block absolute mx-auto object-cover inset-x-0 lg:inset-x-auto lg:object-top w-auto lg:w-[90%] h-full opacity-90 dark:opacity-50 pointer-events-none"
                  />
                </div>
                <div className="flex flex-col justify-center lg:w-1/2 gap-1 p-4 md:p-8 lg:pl-0 lg:h-full">
                  <div className="flex flex-col gap-2">
                    <LabelBadge text="5 pieces" />
                    <p className="text-foreground">Wandrd Backpack</p>
                    <p className="text-foreground-lighter text-sm">
                      Registrations are closed to participate in winning a{' '}
                      <a
                        className="text-foreground hover:underline"
                        href="https://eu.wandrd.com/products/prvke?variant=39360658473002"
                        target="_blank"
                      >
                        Wandrd backpack
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            }
          />
          <div className="w-full min-h-[400px] flex flex-col gap-4 items-stretch">
            <LaunchWeekPrizeCard
              className="relative flex-grow"
              content={
                <div className="flex flex-col h-full justify-end">
                  <div className="relative flex-grow w-full">
                    <Image
                      src="/images/launchweek/12/world-tour-tshirt.png"
                      alt="Supabase Launch Week 12 World Tour T-Shirt"
                      draggable={false}
                      width={300}
                      height={300}
                      quality={100}
                      className="absolute object-cover inset-0 object-right lg:object-right w-full h-full opacity-100 pointer-events-none"
                    />
                  </div>
                  <div className="relative flex flex-col justify-center w-full gap-1 p-4 md:p-6 bg-surface-75 border-t border-muted">
                    <div className="flex flex-col gap-2">
                      <LabelBadge text="30 t-shirts" />
                      <p className="text-foreground">World Tour T-Shirt</p>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
