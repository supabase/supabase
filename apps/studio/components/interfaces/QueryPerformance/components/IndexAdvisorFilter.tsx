import { Lightbulb, X } from 'lucide-react'
import { Button, cn } from 'ui'

interface IndexAdvisorFilterProps {
  isActive: boolean
  onToggle: () => void
}

export const IndexAdvisorFilter = ({ isActive, onToggle }: IndexAdvisorFilterProps) => {
  return (
    <Button
      type={isActive ? 'default' : 'outline'}
      size="tiny"
      className={cn(isActive ? 'bg-surface-300' : 'border-dashed')}
      onClick={onToggle}
      iconRight={isActive ? <X size={14} /> : undefined}
    >
      <span className="flex items-center gap-x-2">
        <Lightbulb size={12} className={isActive ? 'text-warning' : 'text-foreground-lighter'} />
        <span>Index Advisor</span>
      </span>
    </Button>
  )
}
