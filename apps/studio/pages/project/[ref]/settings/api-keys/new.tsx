import {
  ApiKeysCreateCallout,
  ApiKeysFeedbackBanner,
} from 'components/interfaces/APIKeys/ApiKeysIllustrations'
import { useApiKeysVisibility } from 'components/interfaces/APIKeys/hooks/useApiKeysVisibility'
import { PublishableAPIKeys } from 'components/interfaces/APIKeys/PublishableAPIKeys'
import { SecretAPIKeys } from 'components/interfaces/APIKeys/SecretAPIKeys'
import ApiKeysLayout from 'components/layouts/APIKeys/APIKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisableInteraction } from 'components/ui/DisableInteraction'
import type { NextPageWithLayout } from 'types'
import { Separator } from 'ui'

const ApiKeysNewPage: NextPageWithLayout = () => {
  const { shouldDisableUI, canInitApiKeys } = useApiKeysVisibility()

  return (
    <>
      {canInitApiKeys && <ApiKeysCreateCallout />}
      <ApiKeysFeedbackBanner />
      <DisableInteraction disabled={shouldDisableUI} className="flex flex-col gap-8">
        <PublishableAPIKeys />
        <Separator />
        <SecretAPIKeys />
      </DisableInteraction>
    </>
  )
}

ApiKeysNewPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysNewPage
