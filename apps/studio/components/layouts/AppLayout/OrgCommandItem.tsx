import PartnerIcon from 'components/ui/PartnerIcon'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Organization } from 'types'
import { cn, CommandItem_Shadcn_ } from 'ui'

export interface OrgCommandItemProps {
  org: Organization
  selectedSlug: string | undefined
  routePathname: string
  hasRouteSlug: boolean
  onClose: () => void
  compactPadding?: boolean
}

export function OrgCommandItem({
  org,
  selectedSlug,
  routePathname,
  hasRouteSlug,
  onClose,
  compactPadding = false,
}: OrgCommandItemProps) {
  const href = (() => {
    if (!hasRouteSlug) return `/org/${org.slug}`
    if (routePathname.includes('[slug]')) return routePathname.replace('[slug]', org.slug)
    if (selectedSlug && routePathname.startsWith(`/v2/org/${selectedSlug}`)) {
      return routePathname.replace(`/v2/org/${selectedSlug}`, `/v2/org/${org.slug}`)
    }
    if (selectedSlug && routePathname.startsWith(`/org/${selectedSlug}`)) {
      return routePathname.replace(`/org/${selectedSlug}`, `/org/${org.slug}`)
    }
    return `/org/${org.slug}`
  })()

  return (
    <CommandItem_Shadcn_
      key={org.slug}
      value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
      className="cursor-pointer w-full"
      onSelect={() => onClose()}
    >
      <Link
        href={href}
        className={cn(
          'w-full flex items-center justify-between text-sm md:text-xs',
          !compactPadding && 'p-0.5'
        )}
      >
        <div className="flex items-center gap-2">
          <span>{org.name}</span>
          <PartnerIcon organization={org} />
        </div>
        {org.slug === selectedSlug && <Check size={16} />}
      </Link>
    </CommandItem_Shadcn_>
  )
}
