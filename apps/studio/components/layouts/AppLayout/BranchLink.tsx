import { Check, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CommandItem_Shadcn_ } from 'ui'

import { sanitizeRoute } from './ProjectDropdown.utils'
import type { Branch } from '@/data/branches/branches-query'
import { useTrack } from '@/lib/telemetry/track'

export interface BranchLinkProps {
  branch: Branch
  isSelected: boolean
  onClose: () => void
}

export function BranchLink({ branch, isSelected, onClose }: BranchLinkProps) {
  const track = useTrack()
  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  const href =
    sanitizedRoute?.replace('[ref]', branch.project_ref) ?? `/project/${branch.project_ref}`

  return (
    <Link passHref href={href}>
      <CommandItem_Shadcn_
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
        <p className="truncate w-60 flex items-center gap-1" title={branch.name}>
          {branch.is_default && <Shield size={14} className="text-amber-900" />}
          {branch.name}
        </p>
        {isSelected && <Check size={14} strokeWidth={1.5} />}
      </CommandItem_Shadcn_>
    </Link>
  )
}
