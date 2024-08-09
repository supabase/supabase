import { useTheme } from 'next-themes'
import React from 'react'
import { cn } from 'ui'
import Panel from '~/components/Panel'

export default function LaunchWeekPrizeCard({
  content,
  className,
  contentClassName,
}: {
  content: any
  className?: string
  contentClassName?: string
}) {
  const { resolvedTheme } = useTheme()

  return (
    <Panel
      hasShimmer
      outerClassName={cn('relative rounded-lg overflow-hidden', className)}
      innerClassName={cn(
        'relative h-full flex flex-col rounded-lg overflow-hidden',
        contentClassName
      )}
      shimmerToColor={
        resolvedTheme?.includes('dark') ? 'hsl(var(--background-alternative-default))' : undefined
      }
      shimmerFromColor={resolvedTheme?.includes('dark') ? 'hsl(var(--border-default))' : undefined}
    >
      {content}
    </Panel>
  )
}
