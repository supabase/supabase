import { Info } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ScaffoldContainer } from '@/components/layouts/Scaffold'

export interface UsageFilterNoticeProps {
  branchName?: string
  hasBranches: boolean
  onViewOrganizationUsage: () => void
}

export const UsageFilterNotice = ({
  branchName,
  hasBranches,
  onViewOrganizationUsage,
}: UsageFilterNoticeProps) => {
  return (
    <ScaffoldContainer className="mt-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-light">
        <p>
          {branchName && `${branchName} branch only.`}
          {!branchName && hasBranches && 'Main branch only. Other branches are tracked separately.'}
          {!branchName && !hasBranches && 'This project only.'}
        </p>
        <div className="flex items-center gap-x-2">
          <Button variant="text" size="tiny" onClick={onViewOrganizationUsage}>
            View organization total
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="tiny"
                className="px-1"
                aria-label="About usage totals"
                icon={<Info size={14} />}
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Billing and quotas use totals from all projects and branches, including deleted
              branches that are no longer selectable.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </ScaffoldContainer>
  )
}
