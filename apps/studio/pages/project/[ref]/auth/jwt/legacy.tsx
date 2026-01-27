import JWTSettings from 'components/interfaces/JwtSecrets/jwt-settings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import type { NextPageWithLayout } from 'types'

import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from 'components/interfaces/JwtSecrets/jwt.constants'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { configKeys } from 'data/config/keys'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const JWTKeysLegacyPage: NextPageWithLayout = () => {
  const client = useQueryClient()
  const { ref: projectRef } = useParams()
  const { projectSettingsLegacyJwtKeys } = useIsFeatureEnabled(['project_settings:legacy_jwt_keys'])

  const { data } = useJwtSecretUpdatingStatusQuery(
    { projectRef },
    { enabled: projectSettingsLegacyJwtKeys }
  )
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
          client.invalidateQueries({ queryKey: configKeys.api(projectRef) })
          client.invalidateQueries({ queryKey: configKeys.settings(projectRef) })
          client.invalidateQueries({ queryKey: configKeys.postgrest(projectRef) })
          toast.success('Successfully updated JWT secret')
          break
        case Failed:
          toast.error(`JWT secret update failed: ${jwtSecretUpdateErrorMessage}`)
          break
      }
    }

    previousJwtSecretUpdateStatus.current = jwtSecretUpdateStatus
  }, [jwtSecretUpdateStatus])

  if (!projectSettingsLegacyJwtKeys) {
    return <UnknownInterface urlBack={`/project/${projectRef}/auth/jwt`} />
  }

  return (
    <JWTKeysLayout>
      <JWTSettings />
    </JWTKeysLayout>
  )
}

JWTKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default JWTKeysLegacyPage
