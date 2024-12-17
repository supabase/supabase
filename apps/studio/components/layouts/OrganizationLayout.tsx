import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, NavMenu, NavMenuItem } from 'ui'
import AccountLayout from './AccountLayout/AccountLayout'
import DefaultLayout from './DefaultLayout'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'
import { AnimatePresence, motion } from 'framer-motion'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const currentPath = useCurrentPath()
  const { slug } = useParams()

  const invoicesEnabledOnProfileLevel = useIsFeatureEnabled('billing:invoices')
  const invoicesEnabled = invoicesEnabledOnProfileLevel

  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })

  const navMenuItems = [
    {
      label: 'Projects',
      href: `/org/${slug}`,
    },
    {
      label: 'General',
      href: `/org/${slug}/general`,
    },
    {
      label: 'Team',
      href: `/org/${slug}/team`,
    },
    {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/billing`,
    },
    {
      label: 'Usage',
      href: `/org/${slug}/usage`,
    },
    {
      label: 'Invoices',
      href: `/org/${slug}/invoices`,
      hidden: !invoicesEnabled,
    },
    {
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
    },
    {
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
    },
    {
      label: 'Legal Documents',
      href: `/org/${slug}/documents`,
    },
  ]

  const filteredNavMenuItems = navMenuItems.filter((item) => !item.hidden)

  return (
    <div className="w-full">
      <AnimatePresence>
        <motion.div
          className="px-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
        >
          <NavMenu className="border-none" aria-label="Organization menu navigation">
            {filteredNavMenuItems.map((item) => (
              <NavMenuItem key={item.label} active={currentPath === item.href}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </motion.div>
      </AnimatePresence>

      {/* <ScaffoldDivider /> */}
      <motion.div
        layoutId="layout-header-bottom-border"
        className="bg-border h-px w-full"
        initial={false}
        transition={{
          duration: 0.15, // Faster duration
          ease: 'easeOut',
        }}
      />

      {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
        <ScaffoldContainer className="mt-8">
          <Alert_Shadcn_ variant="default" className="flex items-center gap-4">
            <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
            <AlertTitle_Shadcn_ className="flex-1">
              This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
            </AlertTitle_Shadcn_>
            <Button type="default" iconRight={<ExternalLink />} asChild disabled={!isSuccess}>
              <a href={data?.url} target="_blank" rel="noopener noreferrer">
                Manage
              </a>
            </Button>
          </Alert_Shadcn_>
        </ScaffoldContainer>
      )}

      {children}
    </div>
  )
}

export default OrganizationLayout
