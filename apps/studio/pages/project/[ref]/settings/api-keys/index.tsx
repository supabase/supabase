import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { useMemo } from 'react'
import { Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import {
  ApiKeysCreateCallout,
  ApiKeysFeedbackBanner,
} from '@/components/interfaces/APIKeys/ApiKeysIllustrations'
import { PublishableAPIKeys } from '@/components/interfaces/APIKeys/PublishableAPIKeys'
import { SecretAPIKeys } from '@/components/interfaces/APIKeys/SecretAPIKeys'
import ApiKeysLayout from '@/components/layouts/APIKeys/APIKeysLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisableInteraction } from '@/components/ui/DisableInteraction'
import { DocsButton } from '@/components/ui/DocsButton'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const ApiKeysNewPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { isCli, isSelfHosted } = useDeploymentMode()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData = [] } = useAPIKeysQuery(
    {
      projectRef,
      reveal: false,
    },
    { enabled: canReadAPIKeys }
  )

  const newApiKeys = useMemo(
    () => apiKeysData.filter(({ type }) => type === 'publishable' || type === 'secret'),
    [apiKeysData]
  )
  const hasNewApiKeys = newApiKeys.length > 0

  if (!IS_PLATFORM) {
    return (
      <div className="flex flex-col gap-8">
        {isCli && (
          <Admonition
            type="default"
            title="Local development with the Supabase CLI"
            description={
              <p>
                The API keys are automatically managed by the Supabase CLI and are not manually
                configurable.
              </p>
            }
            actions={<DocsButton href={`${DOCS_URL}/guides/local-development`} />}
          />
        )}
        {isSelfHosted && (
          <Admonition
            type="default"
            title="Self-hosted Supabase"
            description={
              <p>
                <code className="text-code-inline">SUPABASE_PUBLISHABLE_KEY</code> and{' '}
                <code className="text-code-inline">SUPABASE_SECRET_KEY</code> are set via
                environment variables.
              </p>
            }
            actions={<DocsButton href={`${DOCS_URL}/guides/self-hosting/self-hosted-auth-keys`} />}
          />
        )}
        <PublishableAPIKeys />
        <Separator />
        <SecretAPIKeys />
      </div>
    )
  }

  return (
    <>
      {canReadAPIKeys && !hasNewApiKeys && <ApiKeysCreateCallout />}
      {hasNewApiKeys && <ApiKeysFeedbackBanner />}
      <DisableInteraction disabled={!hasNewApiKeys} className="flex flex-col gap-8">
        <PublishableAPIKeys />
        <Separator />
        <SecretAPIKeys />
      </DisableInteraction>
    </>
  )
}

ApiKeysNewPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="API Keys">
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysNewPage
