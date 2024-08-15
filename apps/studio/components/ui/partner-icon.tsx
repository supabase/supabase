import { Organization } from 'types'
import { Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

export function PartnerIcon({ organization }: { organization: Pick<Organization, 'managed_by'> }) {
  if (organization.managed_by === 'vercel-marketplace') {
    return (
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <div className="h-5 w-5 bg-surface-100 dark:bg-surface-200 border rounded flex items-center justify-center hover:bg-surface-400 dark:hover:bg-surface-400 hover:border-stronger flex-shrink-0">
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              ∏
              <path
                d="M37.5274 0L75.0548 65H0L37.5274 0Z"
                fill="hsl(var(--foreground-default) / 1)"
              />
            </svg>
          </div>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_>
          This organization is managed by Vercel Marketplace.
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    )
  }

  return null
}
