import Link from 'next/link'
import { memo } from 'react'

import { Button, IconExternalLink, cn } from 'ui'

export const IPv4DeprecationBanner = memo(() => {
  return (
    <div
      role="region"
      aria-label="Deprecation notice"
      className="flex items-center justify-center gap-x-4 bg-surface-100 p-2 transition text-foreground box-border border-b border-default"
    >
      <p className="text-sm">
        Prepare for the PgBouncer and IPv4 deprecations on 26th January 2024{' '}
        <Link
          href="https://github.com/orgs/supabase/discussions/17817"
          target="_blank"
          rel="noreferrer"
          className={cn(
            'sm:hidden',
            'inline-flex items-center justify-center px-2.5 py-1',
            'border border-transparent rounded-md',
            'text-xs text-brand-600 hover:bg-brand-400',
            'ease-out duration-200 transition-all'
          )}
          aria-hidden="true"
        >
          Learn more
        </Link>
      </p>
      <div className="max-sm:sr-only sm:flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<IconExternalLink />}>
          <a
            href="https://github.com/orgs/supabase/discussions/17817"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
      </div>
    </div>
  )
})
IPv4DeprecationBanner.displayName = 'IPv4DeprecationBanner'
