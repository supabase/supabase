import { Link, Check } from 'lucide-react'
import { useState } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface ReportSectionHeaderProps {
  id: string
  title: string
  description: string
}

export const ReportSectionHeader = ({ id, title, description }: ReportSectionHeaderProps) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const copyLinkToClipboard = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(id)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        <ButtonTooltip
          type="text"
          icon={copiedLink === id ? <Check size={14} /> : <Link size={14} />}
          className="w-7 h-7"
          tooltip={{
            content: {
              side: 'bottom',
              text: copiedLink === id ? 'Link copied!' : 'Copy link to section',
            },
          }}
          onClick={copyLinkToClipboard}
        />
      </div>
      <p className="text-foreground-light text-sm">{description}</p>
    </div>
  )
}
