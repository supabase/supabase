import { CheckIcon } from 'lucide-react'

import { CommandItemLink } from '@/components/ui/CommandItemLink'
import PartnerIcon from '@/components/ui/PartnerIcon'
import type { Organization } from '@/types'

export interface OrgCommandItemProps {
  org: Organization
  selectedSlug: string | undefined
  routePathname: string
  hasRouteSlug: boolean
  onClose: () => void
}

export function OrgCommandItem({
  org,
  selectedSlug,
  routePathname,
  hasRouteSlug,
  onClose,
}: OrgCommandItemProps) {
  const href = hasRouteSlug ? routePathname.replace('[slug]', org.slug) : `/org/${org.slug}`

  return (
    <CommandItemLink
      key={org.slug}
      href={href}
      value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
      className="cursor-pointer w-full"
      onSelect={onClose}
    >
      <div className="w-full flex items-center justify-between p-0.5 md:p-0 text-sm md:text-xs">
        <div className="flex items-center gap-2">
          <span>{org.name}</span>
          <PartnerIcon organization={org} />
        </div>
        {org.slug === selectedSlug && <CheckIcon size={16} />}
      </div>
    </CommandItemLink>
  )
}
