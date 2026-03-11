import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from 'ui'

interface NextUpProps {
  title: string
  description: string
  href: string
  chapterNumber?: number
}

export function NextUp({ title, description, href, chapterNumber }: NextUpProps) {
  return (
    <div className="mt-16 mb-8 grow">
      <div className="bg-background border border-border rounded-lg shadow-sm p-8 max-w-2xl">
        <div className="grid gap-4">
          <p className="text-sm text-foreground-lighter">Next Up</p>
          <h2 className="text-xl font-bold text-foreground">
            {chapterNumber && <span>{chapterNumber}: </span>}
            {title}
          </h2>
          <p className="text-foreground text-base">{description}</p>
          <div className="mt-2">
            <Link href={href}>
              <Button
                type="default"
                iconRight={<ArrowRight className="h-4 w-4" />}
                className="flex items-center gap-2"
              >
                Start {chapterNumber ? `Chapter ${chapterNumber}` : 'Next'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
