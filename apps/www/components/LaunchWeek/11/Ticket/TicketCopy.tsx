import { useState, useRef } from 'react'
import { SPECIAL_ANNOUNCEMENT_URL } from '~/lib/constants'
import { Check, Copy } from 'lucide-react'
import useConfData from '../../hooks/use-conf-data'

export default function TicketCopy() {
  const { userData } = useConfData()
  const { username, platinum, secret } = userData
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasSecretTicket = secret
  const url = `${SPECIAL_ANNOUNCEMENT_URL}/tickets/${username}?lw=11${
    hasSecretTicket ? '&secret=true' : platinum ? `&platinum=true` : ''
  }`

  return (
    <div className="h-full w-full">
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
        className="w-full h-full flex justify-center md:justify-start items-center gap-2 relative text-foreground-light hover:text-foreground text-xs"
      >
        <div className="w-4 min-w-4 flex-shrink-0">
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
        </div>
        <span className="truncate">{url}</span>
      </button>
    </div>
  )
}
