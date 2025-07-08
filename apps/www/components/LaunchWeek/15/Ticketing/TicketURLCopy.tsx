import { useState, useRef } from 'react'
import { LW14_URL } from 'lib/constants'
import { Check, Copy } from 'lucide-react'
import { UserTicketData } from '../hooks/use-conf-data'
import { cn } from 'ui'

export default function TicketURLCopy({
  user,
  className,
}: {
  user?: UserTicketData
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const username = user?.username
  const buttonRef = useRef<HTMLButtonElement>(null)
  const displayUrl = `.../launch-week/tickets/${username}`
  const link = `${LW14_URL}/tickets/${username}`

  return (
    <button
      type="button"
      name="Copy"
      ref={buttonRef}
      onClick={() => {
        navigator.clipboard.writeText(link).then(() => {
          setCopied(true)
          setTimeout(() => {
            setCopied(false)
          }, 2000)
        })
      }}
      className={cn(
        'font-mono w-full px-2 lg:px-3.5 !pr-1 py-1 rounded-md bg-alternative-200 border flex gap-2 relative text-foreground-light hover:text-foreground text-xs pointer-events-auto justify-between items-center hover:border-stronger transition-all',
        className
      )}
    >
      <span className="truncate">{displayUrl}</span>
      <div className="w-6 min-w-6 h-6 flex items-center justify-center flex-shrink-0 border border-strong rounded bg-muted hover:bg-selection hover:border-stronger">
        {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={1.5} />}
      </div>
    </button>
  )
}
