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
import { InlineLink } from '@/components/ui/InlineLink'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SELF_HOSTED_AUTH_KEYS_DOCS_URL } from '@/lib/api/self-hosted/constants'
import type { NextPageWithLayout } from '@/types'

const ApiKeysNewPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
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
      <>
        <Admonition
          type="default"
          title="Managed via configuration variables"
          description={
            <>
              Publishable and secret API keys are configured outside of Studio for self-hosted
              deployments via the <code>SUPABASE_PUBLISHABLE_KEY</code> and{' '}
              <code>SUPABASE_SECRET_KEY</code> environment variables. See the{' '}
              <InlineLink href={SELF_HOSTED_AUTH_KEYS_DOCS_URL}>
                self-hosted auth keys guide
              </InlineLink>{' '}
              for setup instructions.
            </>
          }
        />
        <PublishableAPIKeys />
        <Separator />
        <SecretAPIKeys />
      </>
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
