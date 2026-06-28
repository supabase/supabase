import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { EnvRow } from '../common/EnvRow'
import { SecretEnvRow } from '../common/SecretRow'
import {
  SERVER_ENV_VARS,
  useConnectServerEnv,
} from '@/components/interfaces/ConnectSheet/useConnectServerEnv'
import CopyButton from '@/components/ui/CopyButton'

function ServerEnvContent() {
  const { ref } = useParams()
  const { apiUrl, publishableKey, jwksUrl, secret, buildEnv, canReadAPIKeys } =
    useConnectServerEnv()

  return (
    <div className="flex flex-col gap-y-4">
      <div className="overflow-hidden rounded-lg border bg-surface-100">
        <div className="flex items-center justify-between border-b bg-surface-200 px-4 py-2">
          <span className="font-mono text-xs text-foreground-light">.env</span>
          <CopyButton
            variant="default"
            size="tiny"
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

      <Admonition
        variant="default"
        title="On Supabase Edge Functions these are injected automatically"
        description="No setup is needed for Edge Functions. For other runtimes, copy the values above into your environment. Need a secret key? Create or manage them in API Keys settings."
        actions={
          ref
            ? [
                <Button asChild key="api-keys" variant="default">
                  <Link href={`/project/${ref}/settings/api-keys`}>View API keys</Link>
                </Button>,
              ]
            : undefined
        }
      />
    </div>
  )
}

export default ServerEnvContent
