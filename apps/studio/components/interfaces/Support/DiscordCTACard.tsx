import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import router from 'next/router'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import { Button } from 'ui'
import { NO_ORG_MARKER } from './SupportForm.utils'

interface DiscordCTACardProps {
  organizationSlug?: string | null
}

export const DiscordCTACard = ({ organizationSlug }: DiscordCTACardProps) => {
  const { data: organizations } = useOrganizationsQuery()
  const [isVisible, setIsVisible] = useState(false)

  const selectedOrg = organizations?.find((org) => org.slug === organizationSlug)
  const isFreePlan = selectedOrg?.plan.id === 'free'

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && isFreePlan && organizationSlug !== NO_ORG_MARKER && (
        <motion.aside
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="w-full overflow-hidden border border-transparent rounded-md relative"
          style={{
            background: '#404EED',
            borderColor: 'color-mix(in srgb, #404EED 95%, #000000)',
          }}
        >
          <div className="flex items-center p-6">
            {/* Decorative background */}
            <div
              className="absolute inset-0 opacity-20 md:opacity-30"
              style={{
                backgroundImage: `url(${router.basePath}/img/support/discord-bg-small.jpg)`,
                backgroundSize: '75%',
                backgroundPosition: '112% 50%',
                backgroundRepeat: 'no-repeat',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)',
              }}
            />
            {/* Content */}
            <div className="relative z-10">
              <div className="flex flex-col gap-3">
                <div>
                  <h5 className="text-sm font-medium text-white">Ask the Discord community</h5>
                  <p className="text-sm text-white/75">
                    Many code-related questions are answered within minutes.
                  </p>
                </div>

                <Link href="https://discord.supabase.com" target="_blank" rel="noreferrer">
                  <Button
                    size="tiny"
                    type="secondary"
                    icon={
                      <SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />
                    }
                    className="bg-white hover:bg-white/90" // Force white button on all color schemes
                  >
                    <span style={{ color: '#404EED' }}>Ask on Discord</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
