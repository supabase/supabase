import { LightbulbIcon, XIcon } from 'lucide-react'
import { Button, cn } from 'ui'

interface IndexAdvisorFilterProps {
  isActive: boolean
  onToggle: () => void
}

export const IndexAdvisorFilter = ({ isActive, onToggle }: IndexAdvisorFilterProps) => {
  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="tiny"
      className={cn(isActive ? 'bg-surface-300' : 'border-dashed')}
      onClick={onToggle}
      iconRight={isActive ? <XIcon size={14} /> : undefined}
    >
      <span className="flex items-center gap-x-2">
        <LightbulbIcon
          size={12}
          className={isActive ? 'text-warning' : 'text-foreground-lighter'}
        />
        <span>Index Advisor</span>
      </span>
    </Button>
  )
}
