'use client'

import type { HTMLAttributes, PropsWithChildren } from 'react'
import { useContext } from 'react'
import { useInView } from 'react-intersection-observer'

import { cn } from 'ui'

import { ReferenceContentInitiallyScrolledContext } from '~/features/docs/Reference.navigation.client'

/**
 * Wrap a reference section with client-side functionality:
 *
 * - Intersection observer to auto-update the URL when the user scrolls the page
 * - An ID to scroll to programmatically. This is on the entire section rather
 *   than the heading to avoid problems with scroll-to position when the heading
 *   is sticky.
 */
export function ReferenceSectionWrapper({
  id,
  link,
  children,
  className,
  ...rest
}: PropsWithChildren<{ id: string; link: string; className?: string }> &
  HTMLAttributes<HTMLElement>) {
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  const { ref } = useInView({
    threshold: 0,
    rootMargin: '-10% 0% -50% 0%',
    onChange: (inView) => {
      if (inView && initialScrollHappened) {
        window.history.replaceState(null, '', link)
      }
    },
  })

  return (
    <section
      ref={ref}
      id={id}
      className={cn('scroll-mt-[calc(var(--header-height)+1rem)]', className)}
      {...rest}
    >
      {children}
    </section>
  )
}
