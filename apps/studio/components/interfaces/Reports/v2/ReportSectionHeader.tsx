import { Link, Check } from 'lucide-react'
import { useState } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { copyToClipboard } from 'ui'

interface ReportSectionHeaderProps {
  id: string
  title: string
  description: string
}

export const ReportSectionHeader = ({ id, title, description }: ReportSectionHeaderProps) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const copyLinkToClipboard = async () => {
    // [jordi] We want to keep the existing query params (filters)
    // But if the user has an anchor in the URL,
    // we remove it and add the one for this section
    // This is so the shared URL shows the exact same report as the one the user is on
    const url = `${window.location.href.split('#')[0]}#${id}`
    await copyToClipboard(url)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <div className="flex flex-col gap-1 mb-4 group">
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={copyLinkToClipboard}
      >
        <h3 className="text-foreground text-lg font-medium">{title}</h3>
        <ButtonTooltip
          type="text"
          icon={copiedLink === id ? <Check size={14} /> : <Link size={14} />}
          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
          tooltip={{
            content: {
              side: 'bottom',
              text: copiedLink === id ? 'Link copied!' : 'Copy link to section',
            },
          }}
        />
      </div>
      <p className="text-foreground-light text-sm">{description}</p>
    </div>
  )
}
