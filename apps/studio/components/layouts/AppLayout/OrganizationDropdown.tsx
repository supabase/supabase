import { useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Boxes } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Badge, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { AppLayoutDropdownError, AppLayoutDropdownWithPopover } from './AppLayoutDropdown'
import { OrganizationDropdownCommandContent } from './OrganizationDropdownCommandContent'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'

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

  const [open, setOpen] = useState(false)
  const close = useEmbeddedCloseHandler(embedded, onClose, setOpen)

  if (isLoadingOrganizations && !embedded) return <GenericSkeletonLoader className="p-2 w-[90px]" />

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
          {!!selectedOrganization && (
            <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
          )}
        </>
      }
      commandContent={commandContent}
      open={open}
      onOpenChange={setOpen}
    />
  )
}
