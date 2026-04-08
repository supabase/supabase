import { useParams } from 'common'
import { Boxes } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Badge, cn } from 'ui'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns'

import { AppLayoutDropdownError, AppLayoutDropdownWithPopover } from './AppLayoutDropdown'
import { OrganizationDropdownCommandContent } from './OrganizationDropdownCommandContent'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import type { Organization } from '@/types'

interface OrganizationDropdownProps {
  embedded?: boolean
  className?: string
  onClose?: () => void
  /** Same command UI as the header org popover; use inside another popover or column. */
  renderCommandContentOnly?: boolean
  onSelectOrganization?: (org: Organization) => void
}

export const OrganizationDropdown = ({
  embedded = false,
  className,
  onClose,
  renderCommandContentOnly = false,
  onSelectOrganization,
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
  const isEmbeddedContext = renderCommandContentOnly || embedded
  const close = useEmbeddedCloseHandler(
    isEmbeddedContext,
    onClose,
    isEmbeddedContext ? undefined : setOpen
  )

  if (isLoadingOrganizations && !embedded && !renderCommandContentOnly)
    return <ShimmeringLoader className="p-2 md:mr-2 w-[90px]" />

  if (isError) return <AppLayoutDropdownError message="Failed to load organizations" />

  const commandEmbedded = renderCommandContentOnly ? false : embedded

  const commandContent = (
    <OrganizationDropdownCommandContent
      embedded={commandEmbedded}
      className={className}
      organizations={organizations ?? []}
      selectedSlug={slug}
      routePathname={router.pathname}
      hasRouteSlug={!!routeSlug}
      organizationCreationEnabled={organizationCreationEnabled}
      onClose={close}
      onSelectOrganization={onSelectOrganization}
    />
  )

  if (renderCommandContentOnly) {
    return isLoadingOrganizations ? <GenericSkeletonLoader className="p-2" /> : commandContent
  }

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
