import { useParams } from 'common'

import { EnvRow } from '../common/EnvRow'
import { SecretEnvRow } from '../common/SecretRow'
import {
  SERVER_ENV_VARS,
  useConnectServerEnv,
} from '@/components/interfaces/ConnectSheet/useConnectServerEnv'
import CopyButton from '@/components/ui/CopyButton'
import { InlineLink } from '@/components/ui/InlineLink'

function ServerEnvContent() {
  const { ref } = useParams()
  const { apiUrl, publishableKey, jwksUrl, secret, buildEnv, canReadAPIKeys } =
    useConnectServerEnv()

  return (
    <div className="flex flex-col gap-y-2">
      <div className="overflow-hidden rounded-lg border bg-surface-75">
        <div className="flex items-center justify-between border-b bg-surface-100 py-2 pl-4 pr-2">
          <span className="font-mono text-xs text-foreground-light">.env</span>
          <CopyButton
            variant="default"
            size="tiny"
            copyLabel="Copy all"
            asyncText={buildEnv}
            aria-label="Copy all variables"
            disabled={!canReadAPIKeys}
          />
        </div>
        <div className="divide-y">
          <EnvRow name={SERVER_ENV_VARS.url} value={apiUrl}>
            <CopyButton
              variant="default"
              size="tiny"
              iconOnly
              aria-label="Copy project URL"
              text={apiUrl}
            />
          </EnvRow>
          <EnvRow name={SERVER_ENV_VARS.publishableKey} value={publishableKey}>
            <CopyButton
              variant="default"
              size="tiny"
              iconOnly
              aria-label="Copy publishable key"
              text={publishableKey}
              disabled={!canReadAPIKeys}
            />
          </EnvRow>
          <SecretEnvRow secret={secret} />
          <EnvRow name={SERVER_ENV_VARS.jwksUrl} value={jwksUrl}>
            <CopyButton
              variant="default"
              size="tiny"
              iconOnly
              aria-label="Copy JWKS URL"
              text={jwksUrl}
            />
          </EnvRow>
        </div>
      </div>

      <p className="text-sm text-foreground-lighter">
        On Edge Functions these are injected automatically. For other runtimes, copy the values
        above
        {ref ? (
          <>
            . Manage keys in{' '}
            <InlineLink href={`/project/${ref}/settings/api-keys`}>API Keys settings</InlineLink>.
          </>
        ) : (
          '.'
        )}
      </p>
    </div>
  )
}

export default ServerEnvContent
