import { Badge } from 'ui'
import { Microscope } from 'lucide-react'

export const BadgeExperimental = () => {
  return (
    <Badge color="scale">
      <Microscope className="!mr-1.5 !w-3.5 !h-3.5" /> Experimental
    </Badge>
  )
}
