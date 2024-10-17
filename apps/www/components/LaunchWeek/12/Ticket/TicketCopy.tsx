import { useState, useRef } from 'react'
import { LW_URL } from '~/lib/constants'
import { Check, Copy } from 'lucide-react'
import useConfData from '../../hooks/use-conf-data'

export default function TicketCopy() {
  const { userData } = useConfData()
  const { username, platinum, secret } = userData
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasSecretTicket = secret
  const displayUrl = `.../launch-week/tickets/${username}?lw=12${
    hasSecretTicket ? '&secret=true' : platinum ? `&platinum=true` : ''
  }`
  const url = `${LW_URL}/tickets/${username}?lw=12${
    hasSecretTicket ? '&secret=true' : platinum ? `&platinum=true` : ''
  }`

  return (
    // <div className="h-full w-full">
    <button
      type="button"
      name="Copy"
      ref={buttonRef}
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true)
          setTimeout(() => {
            setCopied(false)
          }, 2000)
        })
      }}
      className="font-mono w-full flex justify-center items-center gap-2 relative text-foreground-light hover:text-foreground text-sm"
    >
      <div className="w-4 min-w-4 flex-shrink-0">
        {copied ? (
          <Check size={14} strokeWidth={3} className="text-foreground" />
        ) : (
          <Copy size={14} strokeWidth={1.5} />
        )}
      </div>
      <span className="truncate">{displayUrl}</span>
    </button>
    // </div>
  )
}
