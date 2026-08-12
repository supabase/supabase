import { useBreakpoint, useParams } from 'common'
import { Boxes } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { usePlanBadgeUpgradeExperiment } from '@/hooks/misc/usePlanBadgeUpgradeExperiment'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
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
  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const {
    data: organizations,
    isPending: isLoadingOrganizations,
    isError,
  } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name

  // GROWTH-775 experiment: in the `test` arm the Free plan badge becomes a clickable
  // entry point into the upgrade funnel. The hook only returns a variant for orgs that can
  // actually convert through the plan panel, so everyone else keeps the plain badge.
  //
  // The badge only exists in the desktop header — `embedded` renders just the command list,
  // and the header itself is `hidden md:flex`. Firing exposure from those enrols users who
  // can never see the treatment, which dilutes both arms.
  const isBelowMd = useBreakpoint('md')
  const { variant: planBadgeVariant } = usePlanBadgeUpgradeExperiment({
    trackExposure: !embedded && !isBelowMd,
  })
  const showPlanBadgeUpgrade = planBadgeVariant === 'test' && !!selectedOrganization && !!slug

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
      routePathname={router.pathname}
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
          <Boxes size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          <span
            className={cn(
              'md:max-w-32 lg:max-w-none truncate hidden md:block',
              !!selectedOrganization ? 'text-foreground' : 'text-foreground-lighter'
            )}
          >
            {orgName ?? 'Select an organization'}
          </span>
          {!!selectedOrganization && <PartnerIcon organization={selectedOrganization} />}
          {/* In the experiment's `test` arm the badge is rendered as a clickable sibling
              (via `trailingContent`) instead, to avoid nesting an `<a>` inside the org link. */}
          {!!selectedOrganization && !showPlanBadgeUpgrade && (
            <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
          )}
        </>
      }
      trailingContent={
        showPlanBadgeUpgrade ? (
          <Link
            href={`/org/${slug}/billing?panel=subscriptionPlan&source=org_plan_badge`}
            className="ml-2 shrink-0"
            aria-label={`Upgrade from the ${selectedOrganization?.plan.name} plan`}
            onClick={() => track('plan_badge_upgrade_clicked')}
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
