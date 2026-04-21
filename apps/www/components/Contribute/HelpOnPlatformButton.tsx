import { Button } from 'ui'
import { getChannelDisplayName } from '~/data/contribute'
import type { ThreadSource } from '~/types/contribute'

interface HelpOnPlatformButtonProps {
  channel: ThreadSource
  externalActivityUrl: string
  type?: 'primary' | 'default'
  className?: string
}

export function HelpOnPlatformButton({
  channel,
  externalActivityUrl,
  type = 'primary',
  className = 'w-full sm:w-fit',
}: HelpOnPlatformButtonProps) {
  const platformName = getChannelDisplayName(channel)

  return (
    <Button asChild type={type} className={className}>
      <a href={externalActivityUrl} target="_blank" rel="noopener noreferrer">
        Help on {platformName}
      </a>
    </Button>
  )
}
