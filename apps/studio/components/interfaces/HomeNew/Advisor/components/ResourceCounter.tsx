import { KeyboardEvent } from 'react'
import { Cuboid } from 'lucide-react'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'
import { Button } from 'ui'

interface ResourceCounterProps {
  onClick?: () => void
  className?: string
}

export const ResourceCounter = ({ onClick, className }: ResourceCounterProps) => {
  const remaining = useAdvisorGameStore((state) => state.getRemainingResources())

  return (
    <Button
      type="text"
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={'absolute top-2 left-2 z-10 justify-start text-left'}
      icon={<Cuboid strokeWidth={1} size={16} className="text-foreground-lighter" />}
    >
      {!onClick && <span>{remaining}</span>}
    </Button>
  )
}
