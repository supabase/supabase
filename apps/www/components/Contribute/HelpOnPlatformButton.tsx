import { Button } from 'ui'
import type { ThreadSource } from '~/types/contribute'

interface HelpOnPlatformButtonProps {
  channel: ThreadSource
  externalActivityUrl: string
  className?: string
}

export function HelpOnPlatformButton({
  channel,
  externalActivityUrl,
  className = 'w-full sm:w-fit',
}: HelpOnPlatformButtonProps) {
  const platformName =
    channel === 'discord' ? 'Discord' : channel === 'reddit' ? 'Reddit' : 'GitHub'

  return (
    <Button asChild type="default" className={className}>
      <a href={externalActivityUrl} target="_blank" rel="noopener noreferrer">
        Help on {platformName}
      </a>
    </Button>
  )
}
