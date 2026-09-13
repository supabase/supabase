import Panel from '~/components/Panel'
import React from 'react'
import { cn } from 'ui'

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
      shimmerToColor="var(--background-alternative-default)"
      shimmerFromColor="var(--border-default)"
    >
      {content}
    </Panel>
  )
}
