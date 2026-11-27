'use client'

import { type ComponentPropsWithoutRef } from 'react'
import { useIsTabActive } from '~/features/ui/Tabs'
import { Heading } from 'ui'
import { removeAnchor } from 'ui/src/components/CustomHTMLElements/CustomHTMLElements.utils'

export function DatabaseAdvisorHeading({
  lintId,
  tag: Tag,
  children,
  ...props
}: ComponentPropsWithoutRef<'h2'> & {
  lintId: string
  tag: 'h2' | 'h3' | 'h4'
}) {
  const isActive = useIsTabActive(lintId)

  if (isActive) {
    return (
      <Heading tag={Tag} {...props}>
        {children}
      </Heading>
    )
  }

  return (
    <Tag {...props} id={undefined}>
      {removeAnchor(children)}
    </Tag>
  )
}
