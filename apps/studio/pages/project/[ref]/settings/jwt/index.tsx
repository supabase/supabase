import JWTSettings from 'components/interfaces/JwtSecrets/jwt-settings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from 'components/interfaces/JwtSecrets/jwt.constants'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { configKeys } from 'data/config/keys'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const JWTKeysLegacyPage: NextPageWithLayout = () => {
  const { ref: projectRef, source } = useParams()
  const client = useQueryClient()

  const { data } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus
  const jwtSecretUpdateError = data?.jwtSecretUpdateError

  const previousJwtSecretUpdateStatus = useRef<JwtSecretUpdateStatus>()
  const { Failed, Updated, Updating } = JwtSecretUpdateStatus
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]

  useEffect(() => {
    if (previousJwtSecretUpdateStatus.current === Updating) {
      switch (jwtSecretUpdateStatus) {
        case Updated:
          client.invalidateQueries(configKeys.api(projectRef))
          client.invalidateQueries(configKeys.settings(projectRef))
          client.invalidateQueries(configKeys.postgrest(projectRef))
          toast.success('Successfully updated JWT secret')
          break
        case Failed:
          toast.error(`JWT secret update failed: ${jwtSecretUpdateErrorMessage}`)
          break
      }
    }

    previousJwtSecretUpdateStatus.current = jwtSecretUpdateStatus
  }, [jwtSecretUpdateStatus])

  return <JWTSettings />
}

JWTKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default JWTKeysLegacyPage
