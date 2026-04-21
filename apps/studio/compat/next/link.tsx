import { Link as TanStackLink } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface LinkProps {
  href: string
  className?: string
  children?: ReactNode
}

export default function Link({ href, className, children }: LinkProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TanStackLink to={href as any} className={className}>
      {children}
    </TanStackLink>
  )
}
