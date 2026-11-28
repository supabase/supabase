import { Link } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'
import { BoxesIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge, cn } from 'ui'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  AppLayoutDropdownError,
  AppLayoutDropdownTriggerButton,
  AppLayoutDropdownWithPopover,
} from './AppLayoutDropdown'
import { OrganizationDropdownCommandContent } from './OrganizationDropdownCommandContent'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { isPartnerBillingOrganization } from '@/data/organizations/managed-by-utils'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useRoutePattern } from '@/hooks/misc/useRoutePattern'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useTrack } from '@/lib/telemetry/track'

interface OrganizationDropdownProps {
  embedded?: boolean
  className?: string
  onClose?: () => void
}

export const OrganizationDropdown = ({
  embedded = false,
  className,
  onClose,
}: OrganizationDropdownProps = {}) => {
  const routePattern = useRoutePattern()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const {
    data: organizations,
    isPending: isLoadingOrganizations,
    isError,
  } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const isBillingEnabled = useIsFeatureEnabled('billing:all')
  const isPlanChangeDisabled = useFlag('disableProjectCreationAndUpdate')

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name

  const isFreePlan = selectedOrganization?.plan.id === 'free'
  // Partners the mapper doesn't know fall through to MANAGED_BY.SUPABASE, hence both checks.
  const isBilledBySupabase =
    selectedOrganization?.managed_by === MANAGED_BY.SUPABASE &&
    !isPartnerBillingOrganization(selectedOrganization.billing_partner)
  const showPlanBadgeUpgrade =
    !!slug && isFreePlan && isBilledBySupabase && isBillingEnabled && !isPlanChangeDisabled

  const [open, setOpen] = useState(false)
  const close = useEmbeddedCloseHandler(embedded, onClose, setOpen)
  const track = useTrack()

  const handleOpenChange = (next: boolean) => {
    if (next) track('header_organization_dropdown_opened')
    setOpen(next)
  }

  if (isLoadingOrganizations && !embedded)
    return <ShimmeringLoader className="p-2 md:mr-2 w-[90px]" />

  if (isError) return <AppLayoutDropdownError message="Failed to load organizations" />

  const commandContent = (
    <OrganizationDropdownCommandContent
      embedded={embedded}
      className={className}
      organizations={organizations ?? []}
      selectedSlug={slug}
      routePathname={routePattern}
      hasRouteSlug={!!routeSlug}
      organizationCreationEnabled={organizationCreationEnabled}
      onClose={close}
    />
  )

  if (embedded)
    return isLoadingOrganizations ? <GenericSkeletonLoader className="p-2" /> : commandContent

  return (
    <AppLayoutDropdownWithPopover
      linkHref={slug ? `/org/${slug}` : '/organizations'}
      linkContent={
        <>
          <BoxesIcon size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          <span
            className={cn(
              'md:max-w-32 lg:max-w-none truncate hidden md:block',
              !!selectedOrganization ? 'text-foreground' : 'text-foreground-lighter'
            )}
          >
            {orgName ?? 'Select an organization'}
          </span>
          {!!selectedOrganization && <PartnerIcon organization={selectedOrganization} />}
          {!!selectedOrganization && !showPlanBadgeUpgrade && (
            <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
          )}
        </>
      }
      trailingContent={
        showPlanBadgeUpgrade ? (
          <Link
            to="/org/$slug/billing"
            params={{ slug }}
            search={{ panel: 'subscriptionPlan', source: 'org_plan_badge' }}
            className="ml-2 shrink-0"
            aria-label={`Upgrade from the ${selectedOrganization?.plan.name} plan`}
            onClick={() => track('upgrade_cta_clicked', { placement: 'org_plan_badge' })}
          >
            <Badge
              variant="default"
              className="cursor-pointer transition-colors hover:border-foreground-muted hover:text-foreground"
            >
              {selectedOrganization?.plan.name}
            </Badge>
          </Link>
        ) : undefined
      }
      commandContent={commandContent}
      open={open}
      onOpenChange={handleOpenChange}
      triggerButton={<AppLayoutDropdownTriggerButton aria-label="Show organizations" />}
    />
  )
}
