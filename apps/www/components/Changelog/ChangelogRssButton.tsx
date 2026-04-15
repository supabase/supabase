import { Rss } from 'lucide-react'
import Link from 'next/link'
import { Button, cn } from 'ui'

type Props = {
  className?: string
}

export function ChangelogRssButton({ className }: Props) {
  return (
    <Button
      asChild
      type="text"
      className={cn(className)}
      icon={<Rss className="h-4 w-4" strokeWidth={2} aria-hidden />}
    >
      <Link href="/changelog-rss.xml">Changelog RSS</Link>
    </Button>
  )
}
