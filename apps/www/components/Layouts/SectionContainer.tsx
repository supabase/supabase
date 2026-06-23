'use client'

import classNames from 'classnames'
import { Ref, forwardRef } from 'react'

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
        `sm:py-18 container relative mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20`,
        className
      )}
    >
      {children}
    </div>
  )
)

SectionContainer.displayName = 'SectionContainer'

export default SectionContainer
