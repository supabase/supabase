import { AnimatePresence, motion, MotionProps, useScroll, useTransform } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, ComponentType, useRef } from 'react'

import { useBreakpoint, useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { cn, NavMenu, NavMenuItem } from 'ui'
import { useProjectContext } from '../ProjectLayout/ProjectContext'

const MotionNavMenu = motion(NavMenu) as ComponentType<ComponentProps<typeof NavMenu> & MotionProps>

// Output range: The padding range for the nav (from compact to expanded)
const paddingRange = [40, 86]

// Output range: The padding range for the image
const iconPaddingRange = [3, 1.5] // From 1.5px (scrolled) to 4px (top)

interface IntegrationTabsProps {
  scroll: ReturnType<typeof useScroll>
  isSticky?: boolean
}

export const IntegrationTabs = ({ scroll, isSticky }: IntegrationTabsProps) => {
  const navRef = useRef(null)
  const { project } = useProjectContext()
  const { id, pageId, childId, childLabel } = useParams()
  const isMobile = useBreakpoint('md')

  const { installedIntegrations } = useInstalledIntegrations()
  // Find the integration details based on ID
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const headerRef = useRef<HTMLDivElement>(null)

  // Input range: The scrollY range for triggering the animation (e.g., 0 to 200px of scroll)
  const scrollRange = [40, headerRef.current?.offsetHeight ?? 128]
  const navInnerLeftPaddingX = useTransform(scroll?.scrollY!, scrollRange, paddingRange)
  const iconPadding = useTransform(scroll?.scrollY!, scrollRange, iconPaddingRange)

  const installedIntegration = installedIntegrations?.find((i) => i.id === id)

  const tabs = installedIntegration
    ? integration?.navigation ?? []
    : (integration?.navigation ?? []).filter((tab) => tab.route === 'overview')

  if (!integration) return null

  return (
    <AnimatePresence>
      <div className="sticky top-[0px] z-[1] bg-dash-sidebar" ref={navRef}>
        <MotionNavMenu
          transition={{ duration: 0.2 }}
          className={cn('px-4 md:px-10 [&_ul]:items-center bg-200', isMobile && '!px-4')}
          aria-label="Integration menu"
          style={{ paddingLeft: !isSticky ? (navInnerLeftPaddingX as unknown as number) : 40 }}
        >
          {isSticky && (
            <motion.div
              layoutId="integration-icon"
              className="w-[20px] h-[20px] relative bg-white rounded"
              transition={{ duration: 0 }}
            >
              {integration?.icon({
                style: { padding: iconPadding.get() },
              })}
            </motion.div>
          )}

          {tabs.map((tab) => {
            const tabUrl = `/project/${project?.ref}/integrations/${integration?.id}/${tab.route}`
            return (
              <div className="flex items-center gap-2" key={tab.route}>
                <NavMenuItem active={pageId === tab.route && !childId}>
                  <Link href={tabUrl}>{tab.label}</Link>
                </NavMenuItem>

                <AnimatePresence>
                  {tab.hasChild && childId && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.12, delay: 0.05 }}
                        className="flex items-center"
                      >
                        <ChevronRight size={14} className="text-foreground-muted" />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.12, delay: 0.1 }}
                        className="flex items-center"
                      >
                        <NavMenuItem active={true} className="flex items-center gap-2">
                          {tab.childIcon}
                          <Link
                            href={`${tabUrl}/${childId}${childLabel ? `?child-label=${childLabel}` : ''}`}
                          >
                            {childLabel ? childLabel : childId}
                          </Link>
                        </NavMenuItem>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </MotionNavMenu>
      </div>
    </AnimatePresence>
  )
}

IntegrationTabs.displayName = 'IntegrationTabs'
