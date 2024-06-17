import { useEffect, useState, useRef } from 'react'
import { SITE_URL } from '~/lib/constants'
import useConfData from '../../hooks/use-conf-data'
import { IconCheck, IconCopy, cn } from 'ui'

export default function TicketCopy({ sharePage }: { sharePage: boolean }) {
  const { userData } = useConfData()
  const { username, golden, metadata } = userData
  const [_copyEnabled, setCopyEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasSecretTicket = metadata?.hasSecretTicket
  const url = `${SITE_URL}/x/tickets/${username}?lw=x${
    hasSecretTicket ? '&secret=true' : golden ? `&platinum=true` : ''
  }`

  useEffect(() => {
    if (navigator.clipboard) {
      setCopyEnabled(true)
    }
  }, [])

  return (
    <div
      className={cn('h-full w-full overflow-hidden max-w-full', sharePage ? 'w-auto' : 'w-full')}
    >
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
          {copied ? (
            <IconCheck size={14} strokeWidth={1.5} />
          ) : (
            <IconCopy size={14} strokeWidth={1.5} />
          )}
        </div>
        <span className="truncate">{url}</span>
      </button>
    </div>
  )
}
