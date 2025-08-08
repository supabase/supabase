import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface InlineLinkProps {
  href: string
  className?: string
  target?: string
  rel?: string
  onClick?: () => void
}

export const InlineLinkClassName =
  'underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground'

export const InlineLink = ({
  href,
  className: _className,
  children,
  ...props
}: PropsWithChildren<InlineLinkProps>) => {
  const className = cn(InlineLinkClassName, _className)
  if (href.startsWith('http')) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer noopener" {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link className={className} href={href} {...props}>
      {children}
    </Link>
  )
}
