import { useParams } from 'common'
import { useSearchParams } from 'next/navigation'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ChevronLeft, Home } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  MotionProps,
  MotionValue,
} from 'framer-motion'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { cn, NavMenu, NavMenuItem } from 'ui'
import { useRef, useState, useEffect, RefObject, forwardRef } from 'react'

export const Header = forwardRef<
  HTMLDivElement,
  {
    scroll?: ReturnType<typeof useScroll>
    isSticky?: boolean
  }
>(({ scroll, isSticky }, ref) => {
  const navRef = useRef(null)

  // Get integration ID from URL params
  const { id } = useParams()
  // Get project context
  const { project } = useProjectContext()
  // Find the integration details based on ID
  const integration = INTEGRATIONS.find((i) => i.id === id)
  // Check if we're on the main integrations page
  const isIntegrationsHome = !id

  const layoutTransition = { duration: 0.15 }

  // Get the selected tab from URL query
  const searchParams = useSearchParams()
  const selectedTab = searchParams?.get('tab') ?? 'overview'

  const headerRef = useRef<HTMLDivElement>(null)

  // Input range: The scrollY range for triggering the animation (e.g., 0 to 200px of scroll)
  const scrollRange = [48, headerRef.current?.offsetHeight ?? 128]

  // Output range: The padding range for the nav (from compact to expanded)
  const paddingRange = [40, 84]
  const navInnerLeftPaddingX = scroll
    ? useTransform(scroll?.scrollY!, scrollRange, paddingRange)
    : 0

  // Output range: The Y position range for the icon (e.g., 0 to 150px movement)
  const iconYRange = [0, headerRef.current?.offsetHeight ? headerRef.current.offsetHeight / 2 : 64] // Change 150 to set the end Y position of the icon
  // Map scrollY to the icon's Y position
  const iconY = scroll ? useTransform(scroll?.scrollY!, scrollRange, iconYRange) : 0

  const MotionNavMenu = motion(NavMenu) as React.ComponentType<
    React.ComponentProps<typeof NavMenu> & MotionProps
  >

  // const isSticky = scroll?.scrollY?.get() > 128

  return (
    <>
      <motion.div
        ref={ref}
        layout
        transition={layoutTransition}
        className={cn(isIntegrationsHome && 'border-b', ' relative')}
      >
        {/* Main header content */}
        <div className="py-6">
          <div className="relative">
            {/* Container with animated padding */}
            <motion.div
              layout
              transition={layoutTransition}
              className="px-10 flex flex-col gap-5"
              //   animate={{
              //     paddingTop: isIntegrationsHome ? '20px' : '0px',
              //   }}
            >
              {/* Navigation link back to integrations landing */}
              <div className="flex items-center gap-2">
                {/* Back arrow */}
                <AnimatePresence>
                  {!isIntegrationsHome && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -10, width: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        href={`/project/${project?.ref}/integrations/landing`}
                        className="text-foreground-light hover:text-foreground transition flex items-center"
                      >
                        <ChevronLeft size={14} />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Two separate spans with the same key */}
                {isIntegrationsHome ? (
                  <motion.span
                    layout
                    key="integrations-text"
                    transition={layoutTransition}
                    className="text-white text-xl"
                  >
                    Integrations
                  </motion.span>
                ) : (
                  <motion.span
                    layout
                    key="integrations-text"
                    transition={layoutTransition}
                    className="text-xs text-foreground-light hover:text-foreground"
                  >
                    <Link href={`/project/${project?.ref}/integrations/landing`}>Integrations</Link>
                  </motion.span>
                )}
              </div>

              {/* Integration details section - only shown when viewing a specific integration */}
              <AnimatePresence>
                {!isIntegrationsHome && integration && (
                  <motion.div
                    layout
                    transition={layoutTransition}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="flex flex-row gap-4 items-center"
                  >
                    {/* Integration icon */}
                    <AnimatePresence>
                      {!isSticky && (
                        <motion.div
                          layoutId="integration-icon"
                          className={cn('w-6 h-6 relative z-[3]')}
                          style={{
                            y: iconY, // Controlled by scrollY (0 to 128px)
                          }}
                          transition={{ duration: 0 }}
                        >
                          <div className="w-full h-full bg-foreground rounded-md" />
                          <Image
                            fill
                            src={integration.icon}
                            alt={`${integration.name}`}
                            className="p-1"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Integration name and description */}
                    <motion.div
                      initial={{ opacity: 1 }}
                      //   animate={{ opacity: 1, x: 0 }}
                      //   exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: 0.3, duration: 0.05 }}
                      className="grow basis-0 w-full"
                    >
                      <div className="flex-col justify-start items-start flex">
                        <div className="text-white text-sm">{integration.name}</div>
                        <div className="text-foreground-light text-xs">
                          {integration.description}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Sticky nav using Framer Motion */}
      {!isIntegrationsHome && (
        // <motion.div
        //   layout
        //   transition={layoutTransition}
        //   initial={{ opacity: 0, height: 0 }}
        //   animate={{ opacity: 1, height: 'auto' }}
        //   exit={{ opacity: 0, height: 0 }}
        //   className="sticky top-0 z-50 bg-background border-b"
        // >
        <div className="sticky top-[0px] z-[1] bg-dash-sidebar" ref={navRef}>
          <MotionNavMenu
            className="px-10 [&_ul]:items-center"
            aria-label="Integration menu"
            style={{
              paddingLeft: !isSticky ? navInnerLeftPaddingX : 40,
            }}
          >
            <AnimatePresence>
              {isSticky && (
                <motion.div
                  initial={{ opacity: 1, scale: 1 }}
                  layoutId="integration-icon"
                  //   initial={{ opacity: 0, scale: 0.67 }}
                  //   animate={{ opacity: 1, scale: 0.67 }}
                  className="w-6 h-6 relative"
                  transition={{ duration: 0 }}
                >
                  <div className="w-full h-full bg-foreground rounded-md" />
                  <Image
                    fill
                    src={integration?.icon as string}
                    alt={`${integration?.name}`}
                    className="p-1"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <NavMenuItem active={selectedTab === 'overview'}>
              <Link href={`/project/${project?.ref}/integrations/${id}?tab=overview`}>
                Overview
              </Link>
            </NavMenuItem>
            <NavMenuItem active={selectedTab === 'wrappers'}>
              <Link href={`/project/${project?.ref}/integrations/${id}?tab=wrappers`}>
                Wrappers
              </Link>
            </NavMenuItem>
            <NavMenuItem active={selectedTab === 'logs'}>
              <Link href={`/project/${project?.ref}/integrations/${id}?tab=logs`}>Logs</Link>
            </NavMenuItem>
          </MotionNavMenu>
          {/* <motion.div className="h-[10px] bg-red-900 origin-left" style={{ scaleX }} /> */}
        </div>
        // </motion.div>
      )}
    </>
  )
})
