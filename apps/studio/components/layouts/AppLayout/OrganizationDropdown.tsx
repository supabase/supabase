import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import { OrganizationDropdownCommandContent } from './OrganizationDropdownCommandContent'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { AlertCircle, Boxes, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  cn,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

interface OrganizationDropdownProps {
  /** When true, render only the command list (no link/trigger). For use inside sheet or popover. */
  embedded?: boolean
  /** Applied to the root when embedded. Use e.g. "bg-transparent" to inherit sheet background. */
  className?: string
  /** When embedded, called when selection should close the parent (e.g. sheet). */
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

  if (isLoadingOrganizations && !embedded) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  if (isError) {
    return (
      <div className="flex items-center space-x-2 text-amber-900">
        <AlertCircle strokeWidth={1.5} />
        <p className="text-sm">Failed to load organizations</p>
      </div>
    )
  }

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

  if (embedded) {
    return isLoadingOrganizations ? (
      <div className="space-y-1 p-2">
        <ShimmeringLoader className="py-2" />
        <ShimmeringLoader className="py-2 w-4/5" />
      </div>
    ) : (
      commandContent
    )
  }

  return (
    <>
      <Link
        href={slug ? `/org/${slug}` : '/organizations'}
        className="flex items-center gap-2 flex-shrink-0 text-sm"
      >
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
      </Link>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          {commandContent}
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
