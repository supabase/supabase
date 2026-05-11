import Image from 'next/image'
import Link from 'next/link'

interface QuoteSectionProps {
  quote: string
  highlight?: string
  author: {
    name: string
    role: string
    image: string
    link: string
  }
}

export function QuoteSection({ quote, highlight, author }: QuoteSectionProps) {
  return (
    <div>
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border bg-surface-200">
        <div className="flex flex-col items-center text-center gap-8 md:gap-12 py-16 md:py-24">
          <q className="text-2xl xl:text-4xl max-w-screen-lg text-foreground-lighter text-balance">
            {quote}
            {highlight && (
              <>
                {' '}
                <span className="text-brand">{highlight}</span>
              </>
            )}
          </q>

          <Link href={author.link} className="hover:opacity-90 transition-opacity">
            <div className="flex flex-row items-center gap-3">
              <Image
                draggable={false}
                src={author.image}
                alt={`${author.name}, ${author.role}`}
                className="w-12 h-12 rounded-full overflow-hidden object-cover"
                width={48}
                height={48}
              />

              <div className="flex flex-col items-start gap-0.5">
                <span className="text-foreground text-sm">{author.name}</span>
                <span className="text-foreground-lighter text-xs">{author.role}</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
