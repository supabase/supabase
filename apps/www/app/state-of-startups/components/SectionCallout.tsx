import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export interface SectionCalloutData {
  eyebrow: string
  body: string
  href: string
  cta: string
  external?: boolean
}

export function SectionCallout({ eyebrow, body, href, cta, external }: SectionCalloutData) {
  return (
    <div className="border-t border-muted px-8 py-8">
      <div className="bg-surface-100/60 border border-muted rounded-lg p-6 flex flex-col gap-3">
        <span className="text-brand-link dark:text-brand text-xs font-mono uppercase tracking-widest">
          {eyebrow}
        </span>
        <p className="text-foreground-light text-balance">{body}</p>
        <Link
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-brand-link dark:text-brand text-sm font-medium hover:underline w-fit"
        >
          {cta}
          <ArrowUpRight size={14} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
