import { Organization } from 'types'
import { cn, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

interface PartnerIconProps {
  organization: Pick<Organization, 'managed_by'>
  showTooltip?: boolean
  tooltipText?: string
  size?: 'small' | 'medium' | 'large'
}

function PartnerIcon({
  organization,
  showTooltip = true,
  tooltipText = 'This organization is managed by Vercel Marketplace.',
  size = 'small',
}: PartnerIconProps) {
  if (organization.managed_by === 'vercel-marketplace') {
    const icon = (
      <svg
        className={cn(
          size === 'small' && 'w-2.5 h-2.5',
          size === 'medium' && 'w-3.5 h-3.5',
          size === 'large' && 'w-5 h-5'
        )}
        viewBox="0 0 76 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="hsl(var(--foreground-default) / 1)" />
      </svg>
    )

    if (!showTooltip) {
      return (
        <div
          className={cn(
            'bg-surface-100 dark:bg-surface-200 border rounded flex items-center justify-center flex-shrink-0',
            size === 'small' && 'h-5 w-5',
            size === 'medium' && 'w-7 h-7',
            size === 'large' && 'w-10 h-10'
          )}
        >
          {icon}
        </div>
      )
    }

    return (
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <div
            className={cn(
              'bg-surface-100 dark:bg-surface-200 border rounded flex items-center justify-center hover:bg-surface-400 dark:hover:bg-surface-400 hover:border-stronger flex-shrink-0',
              size === 'small' && 'h-5 w-5',
              size === 'medium' && 'w-7 h-7',
              size === 'large' && 'w-10 h-10'
            )}
          >
            {icon}
          </div>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_>{tooltipText}</TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    )
  }

  return null
}

export default PartnerIcon
