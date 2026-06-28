import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ConnectServerEnvSecret, SERVER_ENV_VARS } from '../../../useConnectServerEnv'
import { EnvRow } from './EnvRow'
import CopyButton from '@/components/ui/CopyButton'

export interface SecretEnvRowProps {
  secret: ConnectServerEnvSecret
}

export function SecretEnvRow({ secret }: SecretEnvRowProps) {
  const isDisabled = !secret.exists || !secret.canReveal

  const onToggle = () => {
    secret.toggle().catch(() => toast.error('Failed to reveal secret API key'))
  }

  const onCopy = async () => {
    try {
      return await secret.getValue()
    } catch {
      toast.error('Failed to copy secret API key')
      return ''
    }
  }

  const revealTooltip = !secret.exists
    ? 'No secret key found for this project'
    : !secret.canReveal
      ? 'You need additional permissions to reveal secret API keys'
      : secret.isRevealed
        ? 'Hide secret key'
        : 'Reveal secret key'

  return (
    <EnvRow name={SERVER_ENV_VARS.secretKey} value={secret.displayValue}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="tiny"
            className={cn('px-1.5', isDisabled && 'opacity-50')}
            aria-label={secret.isRevealed ? 'Hide secret key' : 'Reveal secret key'}
            loading={secret.isRevealed && secret.isRevealing}
            icon={secret.isRevealed ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
            onClick={onToggle}
            disabled={isDisabled}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">{revealTooltip}</TooltipContent>
      </Tooltip>
      <CopyButton
        variant="default"
        size="tiny"
        iconOnly
        aria-label="Copy secret key"
        asyncText={onCopy}
        disabled={isDisabled}
      />
    </EnvRow>
  )
}
