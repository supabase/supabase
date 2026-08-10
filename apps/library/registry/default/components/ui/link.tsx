import { type ComponentPropsWithoutRef } from 'react'
import { cn } from 'ui'

export function Link({ className, href, ...props }: ComponentPropsWithoutRef<'a'>) {
  // A simplified link component for UI Library examples
  // Renders as a regular <a> tag to support iframe base path routing
  // Remove leading slash for relative paths to work with base tag
  const relativeHref = href?.startsWith('/') ? href.slice(1) : href

  return <a {...props} href={relativeHref} className={cn('cursor-pointer', className)} />
}
