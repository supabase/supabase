import { CheckIcon, CircleDotIcon, DiffIcon, GitPullRequestIcon } from 'lucide-react'
import { cn } from 'ui'

import type { ChatEmbedData } from './content'

const CARD = 'rounded-lg border border-muted bg-surface-100 px-3 py-2.5 text-sm'

/** A small piece of UI inside an agent's reply, showing what the agent just did. */
export function ChatEmbed({ embed }: { embed: ChatEmbedData }) {
  if (embed.type === 'diff') {
    return (
      <div className={cn(CARD, 'flex w-fit items-center gap-2')}>
        <span className="flex size-5 items-center justify-center rounded-sm border border-strong text-foreground-light">
          <DiffIcon aria-hidden size={12} strokeWidth={1.5} />
        </span>
        <span className="text-brand-600">
          <span className="sr-only">Lines added: </span>+{embed.added}
        </span>
        <span className="text-destructive-600">
          <span className="sr-only">Lines removed: </span>−{embed.removed}
        </span>
      </div>
    )
  }

  if (embed.type === 'status') {
    return (
      <div className={cn(CARD, 'flex items-center gap-2.5 text-foreground-light')}>
        <span aria-hidden className="size-2 flex-none rounded-full bg-brand ring-3 ring-brand/20" />
        <span className="sr-only">Running at </span>
        {embed.url}
      </div>
    )
  }

  if (embed.type === 'pull-request') {
    return (
      <div className={cn(CARD, 'flex flex-col gap-1')}>
        <span className="flex items-center gap-2 text-foreground">
          <GitPullRequestIcon aria-hidden size={14} strokeWidth={1.5} className="flex-none" />
          {embed.title}
        </span>
        <span className="flex items-center gap-2 text-foreground-light">
          <CheckIcon aria-hidden size={14} strokeWidth={1.5} className="flex-none text-brand-600" />
          {embed.check}
        </span>
      </div>
    )
  }

  if (embed.type === 'issue') {
    return (
      <div className={cn(CARD, 'flex flex-col gap-1')}>
        <span className="flex items-center gap-2 text-foreground">
          <CircleDotIcon
            aria-hidden
            size={14}
            strokeWidth={1.5}
            className="flex-none text-destructive-600"
          />
          {embed.title}
        </span>
        <span className="pl-5.5 text-foreground-lighter">{embed.category}</span>
      </div>
    )
  }

  const tallest = Math.max(...embed.values)
  return (
    <div className={cn(CARD, 'flex flex-col gap-2')}>
      <span className="text-foreground-light">{embed.title}</span>
      <div role="img" aria-label={embed.description} className="flex h-14 items-end gap-px">
        {embed.values.map((value, index) => (
          <span
            key={index}
            style={{ height: `${(value / tallest) * 100}%` }}
            className={cn(
              'flex-1',
              embed.spikeFrom === undefined && 'bg-brand',
              embed.spikeFrom !== undefined && index < embed.spikeFrom && 'bg-foreground-muted',
              embed.spikeFrom !== undefined &&
                index >= embed.spikeFrom &&
                (embed.spikeTone === 'good' ? 'bg-brand' : 'bg-destructive')
            )}
          />
        ))}
      </div>
    </div>
  )
}
