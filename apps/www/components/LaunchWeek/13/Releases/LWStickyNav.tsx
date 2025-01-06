import React, { FC, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { WeekDayProps, mainDays } from './data'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { isBrowser } from 'common'

import SectionContainer from '~/components/Layouts/SectionContainer'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { startCase } from 'lodash'

const LWXStickyNav: FC = () => {
  const days = mainDays()
  const [activeNavItem, setActiveNavItem] = useState('Mon')

  const OFFSET = 66
  const anchors = useRef<NodeListOf<HTMLHeadingElement> | null>(null)
  const links = useRef<NodeListOf<HTMLHeadingElement> | null>(null)

  const handleScroll = () => {
    let newActiveAnchor: string = ''

    anchors.current?.forEach((anchor) => {
      const { y: offsetFromTop } = anchor.getBoundingClientRect()

      if (offsetFromTop - OFFSET < 0) {
        newActiveAnchor = anchor.id

        // Set the active nav item based on the anchor ID
        const matchingDay = days.find((day) => day.id === newActiveAnchor)
        if (matchingDay) {
          setActiveNavItem(matchingDay.dd)
        } else if (newActiveAnchor === 'build-stage') {
          setActiveNavItem('Build Stage')
        }
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
      <nav className="sticky z-30 top-0 bg-default/30 dark:bg-default/90 backdrop-blur-md w-full border-b dark:border-muted h-[60px] flex items-center">
        <SectionContainer className="!max-w-none !py-0 lg:!container flex items-center justify-between font-mono gap-4 md:gap-8 text-sm">
          <div className="w-full flex items-center gap-4 md:gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="outline"
                  iconRight={<ChevronDown />}
                  className="md:hidden w-[200px] min-w-[150px] flex justify-between items-center py-2 pointer-events-auto"
                >
                  <span className="flex gap-1 items-center">{activeNavItem}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="pointer-events-auto">
                {days.map((day) => (
                  <DropdownMenuItem key={day.id} asChild>
                    <Link href={`#${day.id}`} className="flex items-center gap-2">
                      {day.dd}
                      {day.isToday && (
                        <span
                          title="Live"
                          className="w-1 h-1 animate-pulse rounded-full bg-brand block"
                        />
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link href="#build-stage">Build Stage</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ul className="w-full lw-sticky-nav flex items-center gap-2 md:gap-4 text-foreground-lighter">
              {days.map((day: WeekDayProps) => (
                <li key={day.id} className="hidden md:block">
                  <Link
                    href={`#${day.id}`}
                    className={cn(
                      'p-1 transition-colors text-foreground-muted hover:text-foreground md:flex items-center pointer-events-auto',
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
              <li className="hidden md:block">
                <Link
                  href="#build-stage"
                  className="p-1 transition-colors hover:text-foreground pointer-events-auto lw-sticky-nav"
                >
                  Build <span className="hidden sm:inline">Stage</span>
                </Link>
              </li>
              <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
                <li>
                  <Link
                    href="/events/launch-week-13-hackathon"
                    target="_blank"
                    className="p-1 transition-colors hover:text-foreground pointer-events-auto flex gap-1"
                  >
                    Hackathon{' '}
                    <ArrowUpRight className="w-4 h-5 text-foreground-muted hidden sm:inline-block" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=meetup"
                    target="_blank"
                    className="p-1 transition-colors hover:text-foreground pointer-events-auto flex gap-1"
                  >
                    Meetups{' '}
                    <ArrowUpRight className="w-4 h-5 text-foreground-muted hidden sm:inline-block" />
                  </Link>
                </li>
                <li className="hidden sm:block">
                  <Link
                    href="#ticket"
                    className="p-1 transition-colors hover:text-foreground pointer-events-auto"
                  >
                    Ticket
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
