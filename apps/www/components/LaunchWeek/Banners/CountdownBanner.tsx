import React from 'react'
import Link from 'next/link'
import Countdown from 'react-countdown'
import _announcement from '~/data/Announcement.json'
import { AnnouncementProps } from '../../Nav/Announcement'
import { useRouter } from 'next/router'

interface CountdownStepProps {
  value: string | number
  unit: string
}

const announcement = _announcement as AnnouncementProps

function CountdownStep({ value, unit }: CountdownStepProps) {
  return (
    <div className="rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-[#FFFFFF50] to-[#FFFFFF00]">
      <div className="py-1 px-2 rounded-md leading-4 flex items-center justify-center bg-gradient-to-b from-[#9E44EF40] to-[#DBB8BF40] backdrop-blur-md">
        <span className="m-0">{value}</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}

function CountdownBanner() {
  const { pathname } = useRouter()
  const isLaunchWeekPage = pathname === '/launch-week'
  const isLaunchWeekSection = pathname.includes('launch-week')

  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      // Render a completed state
      return (
        <div className="w-full flex gap-3 md:gap-6 items-center justify-center">
          <p>Supabase Launch Week 7</p>
          <div>
            <Link href="/launch-week">
              <a className="bg-white text-xs px-1.5 md:px-2.5 py-1 rounded-full text-[#9E44EF] shadow-none hover:shadow-mg cursor-pointer">
                Explore
              </a>
            </Link>
          </div>
        </div>
      )
    } else {
      // Render countdown
      return (
        <div
          className={[
            'w-full flex gap-3 md:gap-6 items-center md:justify-center text-sm md:text-base',
            isLaunchWeekSection && '!justify-center',
          ].join(' ')}
        >
          <p>
            <span className="hidden md:inline">Supabase</span> Launch Week 7
          </p>
          <div className="flex gap-1 items-center">
            <CountdownStep value={days} unit="d" /> :
            <CountdownStep value={hours} unit="h" /> :
            <CountdownStep value={minutes} unit="m" /> :
            <CountdownStep value={seconds} unit="s" />
          </div>
          {!isLaunchWeekPage && (
            <div className="hidden md:block">
              <Link href="/launch-week">
                <a className="bg-white text-xs px-1.5 md:px-2.5 py-1 rounded-full text-[#9E44EF] shadow-none hover:shadow-mg cursor-pointer">
                  Get your ticket
                </a>
              </Link>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="w-full h-14 p-2 bg-gradient-to-r from-[#9E44EF] to-[#DBB8BF] bg-blue-300 flex items-center justify-center text-white">
      <Countdown date={new Date(announcement.launchDate)} renderer={renderer} />
    </div>
  )
}

export default CountdownBanner
