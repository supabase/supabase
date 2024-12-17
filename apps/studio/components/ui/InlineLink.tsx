import Link from 'next/link'
import { PropsWithChildren } from 'react'

interface InlineLinkProps {
  href: string
}

export const InlineLink = ({ href, children }: PropsWithChildren<InlineLinkProps>) => {
  const className =
    'underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground'
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
