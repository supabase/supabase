import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/compat/router'
import Link from 'next/link'
import { forwardRef, useRef } from 'react'

import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Badge, cn } from 'ui'

interface HeaderProps {
  scroll: ReturnType<typeof useScroll>
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(({ scroll }, ref) => {
  const router = useRouter()
  const { id } = useParams()
  // Get project context
  const { project } = useProjectContext()
  // Find the integration details based on ID
  const integration = INTEGRATIONS.find((i) => i.id === id)
  // Check if we're on the main integrations page
  const isIntegrationsHome = !id

  const layoutTransition = { duration: 0.15 }

  const headerRef = useRef<HTMLDivElement>(null)

  // Input range: The scrollY range for triggering the animation (e.g., 0 to 200px of scroll)
  const scrollRange = [40, headerRef.current?.offsetHeight ?? 128]

  // Output range: The Y position range for the icon (e.g., 0 to 150px movement)
  const iconYRange = [0, headerRef.current?.offsetHeight ? headerRef.current.offsetHeight / 2 : 64] // Change 150 to set the end Y position of the icon
  // Output range: The size range for the icon container
  const sizeRange = [32, 20] // From 24px (scrolled) to 32px (top)
  // Output range: The padding range for the image
  const iconPaddingRange = [3, 1.5] // From 1.5px (scrolled) to 4px (top)

  // Map scrollY to the icon's Y position
  const iconY = useTransform(scroll?.scrollY!, scrollRange, iconYRange)

  const iconSize = useTransform(scroll?.scrollY!, scrollRange, sizeRange)

  const iconPadding = useTransform(scroll?.scrollY!, scrollRange, iconPaddingRange)

  if (!router?.isReady) {
    return null
  }

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
                      className="text-foreground text-xl !p-0"
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
                      className="text-xs text-foreground-light hover:text-foreground !p-0"
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
                    <motion.div
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      layoutId="integration-icon"
                      className={
                        'relative bg-white border border-muted rounded z-[3] flex flex-shrink-0 items-center justify-center'
                      }
                      style={{
                        y: iconY, // Controlled by scrollY (0 to 128px)
                        width: iconSize,
                        height: iconSize,
                        minWidth: iconSize,
                        minHeight: iconSize,
                      }}
                    >
                      {integration.icon({
                        style: {
                          padding: iconPadding.get(),
                        },
                      })}
                    </motion.div>

                    {/* Integration name and description */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto', minHeight: 32 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex-col justify-start items-start flex">
                        <div className="text-foreground text-sm flex items-center gap-x-2">
                          <span>{integration.name}</span>
                          {integration.beta && (
                            <Badge variant="warning" className="py-0 px-1.5">
                              Beta
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground-light text-xs">{integration.description}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
})

Header.displayName = 'Header'
