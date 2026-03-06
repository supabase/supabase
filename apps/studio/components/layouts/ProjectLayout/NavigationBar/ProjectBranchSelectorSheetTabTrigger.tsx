import type { LucideIcon } from 'lucide-react'
import { cn, TabsTrigger_Shadcn_ } from 'ui'

export interface ProjectBranchSelectorSheetTabTriggerProps {
  value: 'organization' | 'project' | 'branch'
  label: string
  icon: LucideIcon
  isMainBranch?: boolean
  isLast: boolean
}

export function ProjectBranchSelectorSheetTabTrigger({
  value,
  label,
  icon: Icon,
  isMainBranch = false,
  isLast,
}: ProjectBranchSelectorSheetTabTriggerProps) {
  const isBranch = value === 'branch'
  const isProductionBranch = isBranch && isMainBranch

  return (
    <TabsTrigger_Shadcn_
      value={value}
      className={cn(
        'group relative text-xs flex flex-col items-center gap-1.5 px-4 py-3 data-[state=active]:bg-surface-200 data-[state=active]:border-foreground-light border-b duration-0',
        isProductionBranch &&
          'text-warning data-[state=active]:text-warning hover:text-warning hover:opacity-70'
      )}
    >
      <Icon className="shrink-0" size={16} strokeWidth={1.5} />
      <span className="truncate max-w-full text-xs leading-tight" title={label}>
        {label}
      </span>

      {!isLast && (
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          viewBox="0 0 6 63"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute duration-0 bottom-0 top-0 -right-2 w-3 h-full z-10"
        >
          <path
            d="M5.49365 31L0.493652 0V62L5.49365 31Z"
            className="fill-[hsl(var(--background-dash-sidebar))] group-data-[state=active]:fill-[hsl(var(--background-surface-200))]"
          />
          <path d="M0.493652 0L5.49365 31L0.493652 62" stroke="hsl(var(--border-default))" />
        </svg>
      )}
    </TabsTrigger_Shadcn_>
  )
}
