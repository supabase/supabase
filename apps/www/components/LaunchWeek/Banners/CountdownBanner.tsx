import React from 'react'
import Link from 'next/link'
import Countdown from 'react-countdown'

interface CountdownStepProps {
  value: string | number
  unit: string
}

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
  const LW7_DATE = '2023-04-10T07:00:00.000-04:00'

  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      // Render a completed state
      return (
        <div className="w-full flex gap-3 md:gap-6 items-center justify-center">
          <p>Supabase Launch Week 7</p>
          <div>
            <Link href="/launch-week">
              <a className="bg-white text-xs px-1.5 md:px-2.5 py-1 rounded-full text-[#9E44EF] shadow-none hover:shadow-mg cursor-pointer">
                Now live
              </a>
            </Link>
          </div>
        </div>
      )
    } else {
      // Render a countdown
      return (
        <div className="w-full flex gap-3 md:gap-6 items-center md:justify-center text-sm md:text-base">
          <p>
            <span className="hidden md:inline">Supabase</span> Launch Week 7
          </p>
          <div className="flex gap-1 items-center">
            <CountdownStep value={days} unit="d" /> :
            <CountdownStep value={hours} unit="h" /> :
            <CountdownStep value={minutes} unit="m" /> :
            <CountdownStep value={seconds} unit="s" />
          </div>
          <div>
            <Link href="/launch-week">
              <a className="bg-white text-xs px-1.5 md:px-2.5 py-1 rounded-full text-[#9E44EF] shadow-none hover:shadow-mg cursor-pointer">
                Get your ticket
              </a>
            </Link>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="w-full h-14 p-2 bg-gradient-to-r from-[#9E44EF] to-[#DBB8BF] bg-blue-300 flex items-center justify-center text-white">
      <Countdown date={new Date(LW7_DATE)} renderer={renderer} />
    </div>
  )
}

export default CountdownBanner
