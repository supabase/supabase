import { Book } from 'lucide-react'
import Link from 'next/link'
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'

import { cn } from 'ui'
import { IntegrationDefinition } from '../Landing/Integrations.constants'

interface BuiltBySectionProps extends ComponentPropsWithoutRef<'div'> {
  integration: IntegrationDefinition
}

export const BuiltBySection = forwardRef<ElementRef<'div'>, BuiltBySectionProps>(
  ({ integration, className, ...props }, ref) => {
    const { docsUrl } = integration
    const { name, websiteUrl } = integration?.author ?? {}

    if (!name && !docsUrl && !websiteUrl) return null

    return (
      <div ref={ref} className={cn('flex items-center gap-10 px-10', className)} {...props}>
        {name && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">BUILT BY</div>
            <div className="text-foreground-light text-sm">{name}</div>
          </div>
        )}
        {docsUrl && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">DOCS</div>
            <Link
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-light hover:text-foreground text-sm flex items-center gap-2"
            >
              <Book size={16} />
              {docsUrl.includes('supabase.com/docs')
                ? 'Supabase Docs'
                : docsUrl.includes('github.com')
                  ? 'GitHub Docs'
                  : 'Documentation'}
            </Link>
          </div>
        )}
        {websiteUrl && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">WEBSITE</div>
            <Link
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-light hover:text-foreground text-sm"
            >
              {websiteUrl.replace('https://', '')}
            </Link>
          </div>
        )}
      </div>
    )
  }
)

BuiltBySection.displayName = 'BuiltBySection'
