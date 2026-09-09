'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from 'ui'

// Paths owned by a different Next.js app on the same origin
const CROSS_APP_PREFIXES = ['/docs', '/dashboard']

/**
 * Returns true when `href` points to a route owned by a different
 * Next.js app on the same origin (e.g. /docs/* or /dashboard/*).
 */
function isCrossAppLink(href?: string): boolean {
  if (!href) return false

  let path = href
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      if (
        url.hostname === 'supabase.com' ||
        url.hostname.endsWith('.supabase.com') ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
      ) {
        path = url.pathname
      } else {
        return false
      }
    } catch {
      return false
    }
  } else {
    path = path.split(/[?#]/)[0]
  }

  return CROSS_APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'))
}

interface Props {
  label: string
  url?: string
  className?: string
  counter?: number
  hasChevron?: boolean
  chevronAnimation?: 'translate' | 'fadeIn'
  target?: '_blank' | '_self'
  onClick?: () => void
}

/**
 * Standard text link component with optional counter and animated chevron.
 */
export function TextLink({
  url = '',
  label,
  className,
  counter,
  hasChevron = true,
  chevronAnimation = 'translate',
  target = '_self',
  ...props
}: Props) {
  return (
    <Link
      href={url}
      prefetch={isCrossAppLink(url) ? false : undefined}
      className={cn(
        'group/text-link text-foreground-light hover:text-foreground mt-3 block cursor-pointer text-sm focus-ring focus-visible:rounded-xs focus-visible:text-foreground',
        className
      )}
      target={target}
      {...props}
    >
      <div className="group flex items-center gap-1">
        <span className="sr-only">{`${label} about ${url}`}</span>
        <span>{label}</span>
        {counter && (
          <span className="text-xs flex items-center justify-center text-foreground-lighter group-hover/text-link:text-foreground">
            ({counter})
          </span>
        )}
        {hasChevron && (
          <div
            className={cn(
              'transition-all group-hover:ml-0.5',
              chevronAnimation === 'fadeIn' && 'opacity-0 group-hover:opacity-100'
            )}
          >
            <ChevronRight size={14} strokeWidth={2} />
          </div>
        )}
      </div>
    </Link>
  )
}
