import { LOCAL_STORAGE_KEYS, useParams } from 'common'

import { LegacyAPIKeys } from 'components/interfaces/APIKeys/LegacyAPIKeys'
import { PublishableAPIKeys } from 'components/interfaces/APIKeys/PublishableAPIKeys'
import { SecretAPIKeys } from 'components/interfaces/APIKeys/SecretAPIKeys'
import {
  ApiKeysComingSoonBanner,
  ApiKeysCreateCallout,
} from 'components/interfaces/APIKeys/ApiKeysIllustrations'
import { useApiKeysVisibility } from 'components/interfaces/APIKeys/hooks/useApiKeysVisibility'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ApiKeysLayout from 'components/layouts/project/[ref]/settings/APIKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { NextPageWithLayout } from 'types'
import { Separator, cn } from 'ui'

const ApiKeysSettings: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const [apiKeysView] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.API_KEYS_VIEW(projectRef ?? ''),
    undefined
  )

  const { isInRollout, shouldDisableUI } = useApiKeysVisibility()

  return (
    <>
      {!isInRollout && <ApiKeysComingSoonBanner />}

      <ApiKeysCreateCallout />

      <div className={cn(shouldDisableUI && 'opacity-50 pointer-events-none')}>
        {apiKeysView !== 'legacy-keys' ? (
          <>
            <PublishableAPIKeys />
            <Separator />
            <SecretAPIKeys />
          </>
        ) : (
          <LegacyAPIKeys />
        )}
      </div>
    </>
  )
}

ApiKeysSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysSettings
