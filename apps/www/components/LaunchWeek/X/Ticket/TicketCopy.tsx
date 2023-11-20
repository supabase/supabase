import { useEffect, useState, useRef } from 'react'
import { SITE_URL } from '~/lib/constants'
import useConfData from '../../hooks/use-conf-data'
import { IconCheck, IconCopy } from 'ui'

export default function TicketCopy() {
  const { userData } = useConfData()
  const { username, golden } = userData
  const [copyEnabled, setCopyEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const url = `${SITE_URL}/tickets/${username}?lw=x${golden ? `&golden=true` : ''}`

  useEffect(() => {
    if (navigator.clipboard) {
      setCopyEnabled(true)
    }
  }, [])

  return (
    <div className="h-full w-full overflow-hidden">
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
        className="w-full h-full flex items-center gap-2 relative text-foreground-light hover:text-foreground text-xs truncate"
      >
        {copied ? (
          <IconCheck size={14} strokeWidth={1.5} />
        ) : (
          <IconCopy size={14} strokeWidth={1.5} />
        )}
        {url}
      </button>
    </div>
  )
}
