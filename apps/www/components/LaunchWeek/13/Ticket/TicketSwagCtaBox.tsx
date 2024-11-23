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
        'bg-alternative/70 backdrop-blur-sm border border-overlay w-full h-auto flex flex-col gap-2 p-2 rounded-lg overflow-hidden shadow-xl',
        className
      )}
    >
      <TicketActions />
      <TicketCopy />
    </div>
  )
}
