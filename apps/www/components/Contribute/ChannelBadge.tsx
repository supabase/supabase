import { MessageCircle, Github, BotMessageSquare } from 'lucide-react'
import { Badge } from 'ui'
import { cn } from 'ui'
import type { ComponentType } from 'react'

/**
 * Returns the appropriate icon component for a given channel
 * @param channel - The channel name (case-insensitive)
 * @returns The icon component for the channel
 */
export function getChannelIcon(
  channel: 'discord' | 'reddit' | 'github'
): ComponentType<{ className?: string }> {
  if (!channel) return MessageCircle

  const normalizedChannel = channel.toLowerCase().trim()

  switch (normalizedChannel) {
    case 'github':
      return Github
    case 'reddit':
      return MessageCircle
    case 'discord':
    default:
      return BotMessageSquare
  }
}

/**
 * Returns the capitalized label for a given channel
 * @param channel - The channel name (case-insensitive)
 * @returns The formatted channel label
 */
export function getChannelLabel(channel: 'discord' | 'reddit' | 'github'): string {
  switch (channel.toLowerCase().trim()) {
    case 'github':
      return 'GitHub'
    case 'reddit':
      return 'Reddit'
    case 'discord':
    default:
      return 'Discord'
  }
}

interface ChannelBadgeProps {
  channel: 'discord' | 'reddit' | 'github'
  className?: string
  iconClassName?: string
}

export function ChannelBadge({ channel, className, iconClassName }: ChannelBadgeProps) {
  const Icon = getChannelIcon(channel)

  return (
    <Badge className={cn(className)}>
      <Icon className={cn('w-3 h-3', iconClassName)} />
      <span className="ml-1">{getChannelLabel(channel)}</span>
    </Badge>
  )
}
