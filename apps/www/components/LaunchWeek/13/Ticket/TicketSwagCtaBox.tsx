import { cn } from 'ui'
import TicketActions from './TicketActions'
import TicketCopy from './TicketCopy'

interface Props {
  className?: string
}

export default function TicketSwagCtaBox({ className }: Props) {
  return (
    <div
      className={cn(
        'bg-surface-75/80 backdrop-blur-sm border border-overlay w-full h-auto flex flex-col rounded-lg overflow-hidden shadow-xl',
        className
      )}
    >
      <div className="flex flex-col gap-2 p-2 bg-alternative/70 border-t border-muted w-full">
        <TicketActions />
        <TicketCopy />
      </div>
    </div>
  )
}
