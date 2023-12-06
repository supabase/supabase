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
  return (
    <Panel
      hasShimmer
      outerClassName={cn('relative rounded-lg overflow-hidden shadow-lg', className)}
      innerClassName={cn(
        'relative h-full flex flex-col bg-[#121516] rounded-lg overflow-hidden text-[#EDEDED]',
        contentClassName
      )}
      shimmerToColor="hsl(var(--background-alternative-default))"
      shimmerFromColor="hsl(var(--border-default))"
    >
      {content}
    </Panel>
  )
}
