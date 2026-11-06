import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM, useParams } from 'common'
import { useMemo } from 'react'
import { Separator } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ApiKeysCreateCallout } from '@/components/interfaces/APIKeys/ApiKeysIllustrations'
import { LegacyAPIKeysRetirementNotice } from '@/components/interfaces/APIKeys/LegacyAPIKeysRetirementNotice'
import { PublishableAPIKeys } from '@/components/interfaces/APIKeys/PublishableAPIKeys'
import { SecretAPIKeys } from '@/components/interfaces/APIKeys/SecretAPIKeys'
import ApiKeysLayout from '@/components/layouts/APIKeys/APIKeysLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisableInteraction } from '@/components/ui/DisableInteraction'
import { DocsButton } from '@/components/ui/DocsButton'
import { apiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'
import { useGrant } from '@/lib/grants'
import type { NextPageWithLayout } from '@/types'

const ApiKeysNewPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { isCli, isSelfHosted } = useDeploymentMode()
  const apiKeysGrant = useGrant('GET /v1/projects/{ref}/api-keys', { projectRef })
  const { data: apiKeysData = [], isSuccess: isSuccessAPIKeys } = useQuery(
    apiKeysQueryOptions({ projectRef, grant: apiKeysGrant.grant })
  )

  const newApiKeys = useMemo(
    () => apiKeysData.filter(({ type }) => type === 'publishable' || type === 'secret'),
    [apiKeysData]
  )
  const hasNewApiKeys = newApiKeys.length > 0
  const shouldShowCreateCallout = isSuccessAPIKeys && !hasNewApiKeys

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
                <code>SUPABASE_PUBLISHABLE_KEY</code> and <code>SUPABASE_SECRET_KEY</code> are set
                via environment variables.
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
      {shouldShowCreateCallout && <ApiKeysCreateCallout />}
      <LegacyAPIKeysRetirementNotice />
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
