import { BookOpen } from 'lucide-react'
import { Button } from 'ui'

interface DocsButtonProps {
  href: string
  abbrev?: boolean
  className?: string
}

export const DocsButton = ({ href, abbrev = true, className }: DocsButtonProps) => {
  return (
    <Button asChild type="default" className={className} icon={<BookOpen />}>
      <a target="_blank" rel="noopener noreferrer" href={href}>
        {abbrev ? 'Docs' : 'Documentation'}
      </a>
    </Button>
  )
}
