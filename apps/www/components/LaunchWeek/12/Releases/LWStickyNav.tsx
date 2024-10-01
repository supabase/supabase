import React, { FC, useEffect, useRef } from 'react'
import Link from 'next/link'
import { WeekDayProps, mainDays } from './data'
import { cn } from 'ui'
import { isBrowser } from 'common'

import SectionContainer from '~/components/Layouts/SectionContainer'

const LWXStickyNav: FC = () => {
  const days = mainDays()

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
    anchors.current = document.querySelectorAll('.lw-nav-anchor')
    links.current = document.querySelectorAll('.lw-sticky-nav li a')

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full">
      <nav className="sticky z-30 top-0 bg-default/90 backdrop-blur-sm pointer-events-auto w-full border-b dark:border-muted h-[60px] flex items-center">
        <SectionContainer className="!max-w-none !py-0 lg:!container flex items-center justify-between font-mono gap-4 md:gap-8 text-sm">
          <div className="w-full flex items-center gap-4 md:gap-8">
            <ul className="w-full lw-sticky-nav flex items-center gap-2 md:gap-4 text-foreground-lighter">
              {days.map((day: WeekDayProps) => (
                <li key={day.id}>
                  <Link
                    href={`#${day.id}`}
                    className={cn(
                      'p-1 transition-colors text-foreground-muted hover:text-foreground flex items-center',
                      (day.isToday || day.shipped) && 'text-foreground-light'
                    )}
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
                  Build <span className="hidden sm:inline">Stage</span>
                </Link>
              </li>
              <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
                <li>
                  <Link href="#meetups" className="p-1 transition-colors hover:text-foreground">
                    Meetups
                  </Link>
                </li>
                <li className="hidden sm:block">
                  <Link href="#awards" className="p-1 transition-colors hover:text-foreground">
                    Awards
                  </Link>
                </li>
              </div>
            </ul>
          </div>
        </SectionContainer>
      </nav>
    </div>
  )
}

export default LWXStickyNav
