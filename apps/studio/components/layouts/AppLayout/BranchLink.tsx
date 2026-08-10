import { Check, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Badge, CommandItem } from 'ui'

import { sanitizeRoute } from './ProjectDropdown.utils'
import type { Branch } from '@/data/branches/branches-query'
import { useTrack } from '@/lib/telemetry/track'

export interface BranchLinkProps {
  branch: Branch
  isSelected: boolean
  hasConfigDrift?: boolean
  onClose: () => void
}

export function BranchLink({
  branch,
  isSelected,
  hasConfigDrift = false,
  onClose,
}: BranchLinkProps) {
  const track = useTrack()
  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  const href =
    sanitizedRoute?.replace('[ref]', branch.project_ref) ?? `/project/${branch.project_ref}`

  return (
    <Link passHref href={href}>
      <CommandItem
        value={branch.name.replaceAll('"', '')}
        className="cursor-pointer w-full flex items-center justify-between text-sm md:text-xs p-2 md:py-1.5 md:px-2"
        onSelect={() => {
          track('branch_selector_branch_clicked', {
            branchId: branch.id,
            branchName: branch.name,
          })
          onClose()
        }}
      >
        <p className="truncate flex-1 min-w-0 flex items-center gap-1" title={branch.name}>
          {branch.is_default && <Shield size={14} className="text-amber-900" />}
          {branch.name}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {hasConfigDrift && <Badge variant="warning">Drift</Badge>}
          {isSelected && <Check size={14} strokeWidth={1.5} />}
        </div>
      </CommandItem>
    </Link>
  )
}
