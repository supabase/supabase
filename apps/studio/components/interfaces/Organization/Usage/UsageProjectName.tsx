import { useQueryStates } from 'nuqs'
import { cn } from 'ui'

import { usageFilterParsers } from './Usage.utils'

interface UsageProjectNameProps {
  name: string
  projectRef: string
  selectedProjectRef?: string | null
  className?: string
}

export const UsageProjectName = ({
  name,
  projectRef,
  selectedProjectRef,
  className,
}: UsageProjectNameProps) => {
  const [, setUsageFilter] = useQueryStates(usageFilterParsers)

  if (selectedProjectRef === projectRef) return <span className={className}>{name}</span>

  return (
    <button
      type="button"
      tabIndex={0}
      title="Show usage for this project only"
      className={cn(
        'text-left transition underline-offset-2 hover:underline hover:text-foreground',
        className
      )}
      onClick={() => setUsageFilter({ projectRef, branchRef: null })}
    >
      {name}
    </button>
  )
}
