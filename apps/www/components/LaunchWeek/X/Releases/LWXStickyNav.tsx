import React, { FC, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WeekDayProps, mainDays as days } from './data'
import { cn } from 'ui'
import { isBrowser } from 'common'

import SectionContainer from '~/components/Layouts/SectionContainer'
import Player from '../Album/Player'

const LWXStickyNav: FC = () => {
  const OFFSET = 66
  const anchors = useRef<NodeListOf<HTMLHeadingElement> | null>(null)
  const links = useRef<NodeListOf<HTMLHeadingElement> | null>(null)

  const handleScroll = () => {
    let newActiveAnchor: string = ''

    anchors.current?.forEach((anchor) => {
      const { y: offsetFromTop } = anchor.getBoundingClientRect()

      if (offsetFromTop - OFFSET < 0) {
        newActiveAnchor = anchor.id
      }
    })

    links.current?.forEach((link) => {
      link.classList.remove('!text-foreground')

      const sanitizedHref = decodeURI(link.getAttribute('href') ?? '')
        .split('#')
        .splice(-1)
        .join('')
      const isMatch = sanitizedHref === newActiveAnchor

      if (isMatch) {
        link.classList.add('!text-foreground')
      }
    })
  }

  useEffect(() => {
    if (!isBrowser) return
    anchors.current = document.querySelectorAll('.lwx-nav-anchor')
    links.current = document.querySelectorAll('.lwx-sticky-nav li a')

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full">
      <nav className="sticky z-30 top-0 bg-[#06080999] backdrop-blur-sm pointer-events-auto w-full border-t border-b border-[#111718] h-[60px] flex items-center">
        <SectionContainer className="!max-w-none !py-0 lg:!container flex items-center justify-between font-mono gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 leading-none uppercase">
              <Link href="/launch-week" className="text-foreground tracking-[1px]">
                Launch Week
              </Link>{' '}
              <Link href="/launch-week/x">
                <Image
                  src="/images/launchweek/lwx/logos/lwx_logo.svg"
                  alt="Supabase Launch Week X icon"
                  width={16}
                  height={16}
                />
              </Link>
            </div>

            {/* Nav items */}
            <ul className="lwx-sticky-nav hidden md:flex items-center gap-2 md:gap-4 text-foreground-muted">
              {days.map((day: WeekDayProps) => (
                <li key={day.id}>
                  <Link
                    href={`#${day.id}`}
                    className={cn('p-1 transition-colors hover:text-foreground flex items-center')}
                  >
                    {day.dd}{' '}
                    {day.isToday && (
                      <span
                        title="Live"
                        className="w-1 h-1 ml-1 animate-pulse rounded-full bg-brand mb-2 block"
                      />
                    )}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="#build-stage" className="p-1 transition-colors hover:text-foreground">
                  Build Stage
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Player />
          </div>
        </SectionContainer>
      </nav>
    </div>
  )
}

export default LWXStickyNav
