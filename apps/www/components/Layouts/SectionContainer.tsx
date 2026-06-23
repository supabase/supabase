'use client'

import classNames from 'classnames'
import { forwardRef, Ref } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  id?: string
}

/**
 * This component doesn't use cn so parent tailwind classes aren't applied correctly
 * At this point it's dangerous to fix it because it could break the layout at many places
 */
const SectionContainer = forwardRef(
  ({ children, className, id }: Props, ref: Ref<HTMLDivElement>) => (
    <div
      ref={ref}
      id={id}
      className={classNames(
        `section-container sm:py-18 relative py-16 md:py-24 lg:py-24`,
        className
      )}
    >
      {children}
    </div>
  )
)

SectionContainer.displayName = 'SectionContainer'

export default SectionContainer
