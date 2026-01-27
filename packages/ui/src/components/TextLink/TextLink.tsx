'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '../../lib/utils/cn'

interface Props {
  label: string
  url?: string
  className?: string
  counter?: number
  hasChevron?: boolean
  chevronAnimation?: 'translate' | 'fadeIn'
  target?: '_blank' | '_self'
}

function TextLink({
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
      className={cn(
        'group/text-link text-foreground-light hover:text-foreground mt-3 block cursor-pointer text-sm focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-foreground-lighter focus-visible:text-foreground',
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

export default TextLink
