import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import {
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import { PermissionsList } from './PermissionList'

const PERMISSIONS_COLLAPSE_THRESHOLD = 5

interface TokenPermissionsSectionProps {
  groupedPermissions: Record<string, string[]>
  totalCount: number
}

export const TokenPermissionsSection = ({
  groupedPermissions,
  totalCount,
}: TokenPermissionsSectionProps) => {
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const shouldCollapse = totalCount > PERMISSIONS_COLLAPSE_THRESHOLD

  if (totalCount === 0) return null

  return (
    <div className="pt-4 border-t border-default">
      {shouldCollapse ? (
        <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="text"
              size="tiny"
              className="w-full justify-start px-0.5 h-auto text-sm font-medium text-foreground-light hover:text-foreground"
            >
              <div className="flex items-center gap-1.5">
                {permissionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Permissions assigned to this token ({totalCount})</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <PermissionsList groupedPermissions={groupedPermissions} />
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <h3 className="text-sm font-medium mb-3">Permissions assigned to this token:</h3>
          <PermissionsList groupedPermissions={groupedPermissions} />
        </>
      )}
    </div>
  )
}
