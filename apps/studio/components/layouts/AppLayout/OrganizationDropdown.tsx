import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { AlertCircle, Boxes, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { CommandSeparator } from 'ui/src/components/shadcn/ui/command'

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
  const close = embedded ? onClose ?? (() => {}) : () => setOpen(false)

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

  const orgListItems = (wrapInScrollArea: boolean) => {
    const list = (
      <>
        {organizations?.map((org) => {
          const href = !!routeSlug
            ? router.pathname.replace('[slug]', org.slug)
            : `/org/${org.slug}`

          return (
            <CommandItem_Shadcn_
              key={org.slug}
              value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
              className="cursor-pointer w-full"
              onSelect={() => {
                close()
                router.push(href)
              }}
              onClick={() => close()}
            >
              <Link
                href={href}
                className="w-full flex items-center justify-between text-sm md:text-xs"
              >
                <div className={cn('flex items-center gap-2', !wrapInScrollArea && 'p-0.5 md:p-0')}>
                  <span>{org.name}</span>
                  <PartnerIcon organization={org} />
                </div>
                {org.slug === slug && <Check size={16} />}
              </Link>
            </CommandItem_Shadcn_>
          )
        })}
      </>
    )
    if (wrapInScrollArea) {
      return (
        <ScrollArea className={(organizations || []).length > 7 ? 'md:h-[210px]' : ''}>
          {list}
        </ScrollArea>
      )
    }
    return list
  }

  const commandContent = embedded ? (
    <Command_Shadcn_ className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
      <div className="flex items-center gap-2 shrink-0 border-b p-2">
        <Button type="text" block size="small" asChild>
          <Link
            href="/organizations"
            className="text-xs text-foreground-light hover:text-foreground"
            onClick={() => close()}
          >
            All Organizations
          </Link>
        </Button>
        {organizationCreationEnabled && (
          <Button
            type="default"
            block
            size="small"
            asChild
            icon={<Plus size={14} strokeWidth={1.5} />}
          >
            <Link
              href="/new"
              className="text-xs text-foreground-light hover:text-foreground"
              onClick={() => close()}
            >
              New organization
            </Link>
          </Button>
        )}
      </div>
      <CommandInput_Shadcn_
        placeholder="Find organization..."
        wrapperClassName="shrink-0"
        className="text-base sm:text-sm"
      />
      <CommandList_Shadcn_ className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 !max-h-none">
        <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_ className="min-h-0">{orgListItems(false)}</CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  ) : (
    <Command_Shadcn_ className={className}>
      <CommandInput_Shadcn_ placeholder="Find organization..." />
      <CommandList_Shadcn_>
        <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_>{orgListItems(true)}</CommandGroup_Shadcn_>
        <CommandSeparator_Shadcn_ />
        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              close()
              router.push('/organizations')
            }}
            onClick={() => close()}
          >
            <Link href="/organizations" className="flex items-center gap-2 w-full">
              All Organizations
            </Link>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
        {organizationCreationEnabled && (
          <>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full"
                onSelect={() => {
                  close()
                  router.push('/new')
                }}
                onClick={() => close()}
              >
                <Link href="/new" className="flex items-center gap-2 w-full">
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New organization</p>
                </Link>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </>
        )}
      </CommandList_Shadcn_>
    </Command_Shadcn_>
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
