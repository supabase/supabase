import React, { FC } from 'react'
import Image from 'next/image'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Link from 'next/link'
import { WeekDayProps, mainDays as days } from './data'
import { cn } from 'ui'

const LWXStickyNav: FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full">
      <nav className="sticky z-40 top-0 bg-[#06080999] backdrop-blur-sm pointer-events-auto w-full border-t border-b border-[#111718] h-[60px] flex items-center">
        <SectionContainer className="!max-w-none !py-0 lg:!container flex items-center justify-between md:justify-start font-mono gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-3 leading-none uppercase">
            <span className="text-foreground tracking-[1px]">Launch Week</span>{' '}
            <Image
              src="/images/launchweek/lwx/logos/lwx_logo.svg"
              alt="Supabase Launch Week X icon"
              width={16}
              height={16}
            />
          </div>

          {/* Nav items */}
          <ul className="hidden md:flex items-center gap-2 md:gap-4 text-foreground-muted">
            {days.map((day: WeekDayProps) => (
              <li key={day.id}>
                <Link
                  href={`#${day.id}`}
                  className={cn(
                    'p-1 transition-colors hover:text-foreground',
                    day.shipped && 'text-foreground-light'
                  )}
                >
                  {day.dd}
                </Link>
              </li>
            ))}
            <li>
              <Link href="#build-stage" className="p-1 transition-colors hover:text-foreground">
                Build Stage
              </Link>
            </li>
          </ul>
        </SectionContainer>
      </nav>
    </div>
  )
}

export default LWXStickyNav
