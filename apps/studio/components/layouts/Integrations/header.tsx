import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { AnimatePresence, motion, MotionProps, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { forwardRef, useRef } from 'react'
import { cn, NavMenu, NavMenuItem } from 'ui'

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
  const scrollRange = [40, headerRef.current?.offsetHeight ?? 128]
  // Output range: The padding range for the nav (from compact to expanded)
  const paddingRange = [40, 86]

  // Output range: The Y position range for the icon (e.g., 0 to 150px movement)
  const iconYRange = [0, headerRef.current?.offsetHeight ? headerRef.current.offsetHeight / 2 : 64] // Change 150 to set the end Y position of the icon
  // Output range: The size range for the icon container
  const sizeRange = [32, 24] // From 24px (scrolled) to 32px (top)
  // Output range: The padding range for the image
  const iconPaddingRange = [3, 1.5] // From 1.5px (scrolled) to 4px (top)

  const navInnerLeftPaddingX = scroll
    ? useTransform(scroll?.scrollY!, scrollRange, paddingRange)
    : 0

  // Map scrollY to the icon's Y position
  const iconY = scroll ? useTransform(scroll?.scrollY!, scrollRange, iconYRange) : 0

  const iconSize = scroll ? useTransform(scroll?.scrollY!, scrollRange, sizeRange) : 32

  const iconPadding = useTransform(scroll?.scrollY!, scrollRange, iconPaddingRange)

  /* prettier-ignore */
  const MotionNavMenu = motion(NavMenu) as React.ComponentType<React.ComponentProps<typeof NavMenu> & MotionProps>
  /* prettier-ignore */
  const MotionNextImage = motion(Image) as React.ComponentType<React.ComponentProps<typeof Image> & MotionProps>

  return (
    <>
      <AnimatePresence>
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
                <div className="flex items-center gap-0.5">
                  {/* Back arrow */}

                  {!isIntegrationsHome && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -10, width: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        href={`/project/${project?.ref}/integrations`}
                        className="text-foreground-light hover:text-foreground transition flex items-center"
                      >
                        <ChevronLeft size={14} />
                      </Link>
                    </motion.div>
                  )}

                  {/* Two separate spans with the same key */}
                  {isIntegrationsHome ? (
                    <motion.span
                      layout
                      key="integrations-text"
                      transition={layoutTransition}
                      className="text-foreground text-xl"
                      style={{
                        padding: iconPadding,
                      }}
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
                      <Link href={`/project/${project?.ref}/integrations`}>Integrations</Link>
                    </motion.span>
                  )}
                </div>

                {/* Integration details section - only shown when viewing a specific integration */}

                {!isIntegrationsHome && integration && (
                  <motion.div
                    layout
                    transition={{
                      duration: 0.2,
                      delay: 0.2,
                    }}
                    className="flex items-center gap-4"
                  >
                    {/* Integration icon */}

                    {/* {!isSticky && ( */}
                    <motion.div
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      layoutId="integration-icon"
                      className={
                        'relative bg-white border border-muted rounded z-[3] flex items-center justify-center'
                      }
                      style={{
                        y: iconY, // Controlled by scrollY (0 to 128px)
                        width: iconSize,
                        height: iconSize,
                      }}
                    >
                      {integration.icon}
                      {/* <MotionNextImage
                        fill
                        src={integration.icon}
                        alt={`${integration.name}`}
                        style={{
                          padding: iconPadding.get(),
                        }}
                      /> */}
                    </motion.div>
                    {/* )} */}

                    {/* Integration name and description */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto', minHeight: 32 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className=""
                    >
                      <div className="flex-col justify-start items-start flex">
                        <div className="text-foreground text-sm">{integration.name}</div>
                        <div className="text-foreground-light text-xs">
                          {integration.description}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Sticky nav using Framer Motion */}
      <AnimatePresence>
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
              //   initial={{ opacity: 1, height: 0 }}
              //   animate={{ opacity: 1, height: 'auto' }}
              //   exit={{ opacity: 1, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-10 [&_ul]:items-center bg-200"
              aria-label="Integration menu"
              style={{
                paddingLeft: !isSticky ? (navInnerLeftPaddingX as number) : 40,
              }}
            >
              {isSticky && (
                <motion.div
                  layoutId="integration-icon"
                  className="w-6 h-6 relative"
                  transition={{ duration: 0 }}
                >
                  <div className="w-full h-full border border-muted bg-white rounded" />
                  <MotionNextImage
                    fill
                    src={integration?.icon as string}
                    alt={`${integration?.name}`}
                    style={{
                      padding: iconPadding.get(),
                    }}
                  />
                </motion.div>
              )}

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
      </AnimatePresence>
    </>
  )
})

Header.displayName = 'Header'
