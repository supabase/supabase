import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import { NO_ORG_MARKER } from './SupportForm.utils'

interface DiscordCTACardProps {
  organizationSlug?: string | null
}

export const DiscordCTACard = ({ organizationSlug }: DiscordCTACardProps) => {
  const { data: organizations } = useOrganizationsQuery()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!organizationSlug || organizationSlug === NO_ORG_MARKER) return null

  const selectedOrg = organizations?.find((org) => org.slug === organizationSlug)
  const isFreePlan = selectedOrg?.plan.id === 'free'

  if (!isFreePlan) return null

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="w-full overflow-hidden border rounded-md relative bg-200 flex flex-col p-6"
        >
          <div className="">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-foreground">Ask the Discord community</p>
                <p className="text-sm text-foreground-lighter">
                  Many code-related questions are answered within minutes.
                </p>
              </div>
              <div>
                <Button asChild size="tiny" type="default" icon={<MessageCircle size={14} />}>
                  <Link href="https://discord.supabase.com" target="_blank" rel="noreferrer">
                    Ask on Discord
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
