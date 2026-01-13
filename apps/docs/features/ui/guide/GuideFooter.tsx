import { ExternalLink } from 'lucide-react'
import { cn } from 'ui'
import { type EditLink } from '~/features/helpers.edit-link'

interface GuideFooterProps {
  className?: string
  editLink: EditLink
}

export function GuideFooter({ className, editLink }: GuideFooterProps) {
  if (!editLink) return null

  return (
    <footer className={cn('mt-16 not-prose', className)}>
      <a
        href={editLink.includesProtocol ? editLink.link : `https://github.com/${editLink.link}`}
        className={cn(
          'w-fit',
          'flex items-center gap-1',
          'text-sm text-scale-1000 hover:text-scale-1200',
          'transition-colors'
        )}
        target="_blank"
        rel="noreferrer noopener edit"
      >
        Edit this page on GitHub <ExternalLink size={14} strokeWidth={1.5} />
      </a>
    </footer>
  )
}
