import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface InlineLinkProps {
  href: string
  className?: string
}

export const InlineLink = ({
  href,
  className: _className,
  children,
}: PropsWithChildren<InlineLinkProps>) => {
  const className = cn(
    'underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground',
    _className
  )
  if (href.startsWith('http')) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    )
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  )
}
