import { Check } from 'lucide-react'
import { cn } from 'ui'

import { CommandItemLink } from '@/components/ui/CommandItemLink'
import PartnerIcon from '@/components/ui/PartnerIcon'
import type { Organization } from '@/types'

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
  const href = hasRouteSlug ? routePathname.replace('[slug]', org.slug) : `/org/${org.slug}`

  return (
    <CommandItemLink
      key={org.slug}
      href={href}
      value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
      className={cn(
        'cursor-pointer w-full flex items-center justify-between text-sm md:text-xs',
        !compactPadding && 'p-0.5'
      )}
      onSelect={onClose}
    >
      <div className="flex items-center gap-2">
        <span>{org.name}</span>
        <PartnerIcon organization={org} />
      </div>
      {org.slug === selectedSlug && <Check size={16} />}
    </CommandItemLink>
  )
}
