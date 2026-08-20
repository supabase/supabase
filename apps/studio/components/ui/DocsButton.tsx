import { BookOpen } from 'lucide-react'
import { Button } from 'ui'

interface DocsButtonProps {
  href: string
  abbrev?: boolean
  className?: string
  topic?: string
  /** Custom button text, e.g. to distinguish multiple docs buttons side by side. */
  label?: string
}

export const DocsButton = ({ href, abbrev = true, className, topic, label }: DocsButtonProps) => {
  return (
    <Button
      asChild
      variant="default"
      className={className}
      icon={<BookOpen />}
      onClick={(e) => e.stopPropagation()}
    >
      <a
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
