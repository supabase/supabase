import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface InlineLinkProps {
  href: string
  className?: string
  target?: string
  rel?: string
  title?: string
  onClick?: () => void
}

export const InlineLinkClassName =
  'underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-inherit hover:text-foreground text-focus'

export const InlineLink = ({
  href,
  className: _className,
  children,
  title,
  ...props
}: PropsWithChildren<InlineLinkProps>) => {
  const className = cn(InlineLinkClassName, _className)
  if (href.startsWith('http')) {
    return (
      <a
        title={title}
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        {...props}
      >
        {children}
      </a>
    )
  }
  return (
    <Link className={className} href={href} title={title} {...props}>
      {children}
    </Link>
  )
}
