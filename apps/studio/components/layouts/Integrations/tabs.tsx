import { AnimatePresence, motion, MotionProps, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import React, { forwardRef, ReactNode, useRef } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { cn, NavMenu, NavMenuItem } from 'ui'
import { useProjectContext } from '../ProjectLayout/ProjectContext'

const MotionNavMenu = motion(NavMenu) as React.ComponentType<
  React.ComponentProps<typeof NavMenu> & MotionProps
>

// Output range: The padding range for the nav (from compact to expanded)
const paddingRange = [40, 86]

// Output range: The padding range for the image
const iconPaddingRange = [3, 1.5] // From 1.5px (scrolled) to 4px (top)

interface IntegrationTabsProps {
  id: string
  tabs: { id: string; label: string; content: ReactNode }[]
  scroll?: ReturnType<typeof useScroll>
  isSticky?: boolean
}

export const IntegrationTabs = forwardRef<HTMLDivElement, IntegrationTabsProps>(
  ({ id, tabs, scroll, isSticky }, ref) => {
    const navRef = useRef(null)

    // Get project context
    const { project } = useProjectContext()
    // Find the integration details based on ID
    const integration = INTEGRATIONS.find((i) => i.id === id)

    // Get the selected tab from URL query
    const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

    const headerRef = useRef<HTMLDivElement>(null)

    // Input range: The scrollY range for triggering the animation (e.g., 0 to 200px of scroll)
    const scrollRange = [40, headerRef.current?.offsetHeight ?? 128]

    const navInnerLeftPaddingX = scroll
      ? useTransform(scroll?.scrollY!, scrollRange, paddingRange)
      : 0

    const iconPadding = useTransform(scroll?.scrollY!, scrollRange, iconPaddingRange)

    return (
      <AnimatePresence>
        {/* <motion.div
           layout
           transition={layoutTransition}
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           exit={{ opacity: 0, height: 0 }}
           className="sticky top-0 z-50 bg-background border-b"
         > */}
        <div className="sticky top-[0px] z-[1] bg-dash-sidebar" ref={navRef}>
          <MotionNavMenu
            //   initial={{ opacity: 1, height: 0 }}
            //   animate={{ opacity: 1, height: 'auto' }}
            //   exit={{ opacity: 1, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-10 [&_ul]:items-center bg-200"
            aria-label="Integration menu"
            style={{ paddingLeft: !isSticky ? (navInnerLeftPaddingX as number) : 40 }}
          >
            {isSticky && (
              <motion.div
                layoutId="integration-icon"
                className="w-6 h-6 relative"
                transition={{ duration: 0 }}
              >
                <div
                  className={cn(
                    'w-full h-full border border-muted rounded transition-all',
                    iconPadding.get() === 1.5 ? 'bg' : 'bg-white'
                  )}
                />
                {integration?.icon({ style: { padding: iconPadding.get() } })}
              </motion.div>
            )}

            {tabs.map((tab) => {
              return (
                <NavMenuItem active={selectedTab === tab.id}>
                  <Link href={`/project/${project?.ref}/integrations/${id}?tab=${tab.id}`}>
                    {tab.label}
                  </Link>
                </NavMenuItem>
              )
            })}
          </MotionNavMenu>
          {/* <motion.div className="h-[10px] bg-red-900 origin-left" style={{ scaleX }} /> */}
        </div>
        {/* </motion.div> */}
      </AnimatePresence>
    )
  }
)
