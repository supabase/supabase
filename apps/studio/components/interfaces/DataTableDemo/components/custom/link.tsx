import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import React from 'react'
import { cn } from 'ui'
import { ArrowUpRight } from 'lucide-react'

export interface LinkProps extends NextLinkProps {
  className?: string
  children?: React.ReactNode
  hideArrow?: boolean
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, children, hideArrow, ...props }, ref) => {
    const isInternal = href?.toString().startsWith('/') || href?.toString().startsWith('#')
    const externalLinkProps = !isInternal ? { target: '_blank', rel: 'noreferrer' } : undefined

    return (
      <NextLink
        className={cn(
          'group text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground',
          'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md',
          className
        )}
        ref={ref}
        href={href}
        {...externalLinkProps}
        {...props}
      >
        {children}
        {!isInternal && !hideArrow ? (
          <ArrowUpRight className="text-muted-foreground w-4 h-4 inline-block ml-0.5 group-hover:text-foreground group-hover:-translate-y-px group-hover:translate-x-px" />
        ) : null}
      </NextLink>
    )
  }
)

Link.displayName = 'Link'

export { Link }
