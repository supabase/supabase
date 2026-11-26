import { BookOpenIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button } from 'ui'

import { useTrack } from '@/lib/telemetry/track'

interface DocsButtonProps {
  href: string
  abbrev?: boolean
  className?: string
  topic?: string
  /** Custom button text, e.g. to distinguish multiple docs buttons side by side. */
  label?: string
  /** PostHog autocapture identifier for this link */
  'data-attr'?: string
}

export const DocsButton = ({
  href,
  abbrev = true,
  className,
  topic,
  label,
  'data-attr': dataAttr,
}: DocsButtonProps) => {
  const track = useTrack()

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    track('docs_button_clicked', { ...(topic && { topic }) })
  }

  return (
    <Button
      asChild
      variant="default"
      className={className}
      icon={<BookOpenIcon />}
      onClick={handleClick}
    >
      <a
        data-attr={dataAttr}
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        aria-label={topic ? `${topic} documentation (opens in new tab)` : undefined}
      >
        {label ?? (abbrev ? 'Docs' : 'Documentation')}
      </a>
    </Button>
  )
}
