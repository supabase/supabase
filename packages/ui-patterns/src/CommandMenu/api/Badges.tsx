import { Microscope } from 'lucide-react'
import { Badge } from 'ui'

interface BadgeExperimentalProps {
  className?: string
}

function BadgeExperimental({ className }: BadgeExperimentalProps) {
  return (
    <Badge className={className}>
      <Microscope className="!mr-1.5 !w-3.5 !h-3.5" /> Experimental
    </Badge>
  )
}

export { BadgeExperimental }
