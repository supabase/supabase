import { Bolt } from 'lucide-react'
import { Badge } from 'ui'

interface TraceButtonProps {
  has_trace: boolean
  id: string
}

export function TraceButton({ has_trace, id }: TraceButtonProps) {
  if (!has_trace) {
    return null
  }

  return (
    <div>
      <Badge variant="default" className="items-center gap-1">
        <Bolt size={12} />
        <span>Has trace</span>
      </Badge>
    </div>
  )
}
