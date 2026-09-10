'use client'

import classNames from 'classnames'
import { forwardRef, Ref } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  id?: string
}

const SectionContainer = forwardRef(
  ({ children, className, id }: Props, ref: Ref<HTMLDivElement>) => (
    <div
      ref={ref}
      id={id}
      className={classNames(`section-container relative py-16 sm:py-18 md:py-24`, className)}
    >
      {children}
    </div>
  )
)

SectionContainer.displayName = 'SectionContainer'

export default SectionContainer
