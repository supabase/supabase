import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { JWTSettings } from '@/components/interfaces/JwtSecrets/jwt-settings'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from '@/components/interfaces/JwtSecrets/jwt.constants'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useJwtSecretUpdatingStatusQuery } from '@/data/config/jwt-secret-updating-status-query'
import { configKeys } from '@/data/config/keys'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/project/$ref/settings/jwt/legacy')({
  component: JWTKeysLegacyPage,
  staticData: { settingsLayoutTitle: 'JWT Keys (Legacy)' },
})

function JWTKeysLegacyPage() {
  const client = useQueryClient()
  const { ref: projectRef } = useParams()
  const { projectSettingsLegacyJwtKeys } = useIsFeatureEnabled(['project_settings:legacy_jwt_keys'])

  const { data } = useJwtSecretUpdatingStatusQuery(
    { projectRef },
    { enabled: projectSettingsLegacyJwtKeys }
  )
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus
  const jwtSecretUpdateError = data?.jwtSecretUpdateError

  const previousJwtSecretUpdateStatus = useRef<JwtSecretUpdateStatus>(undefined)
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
    return <UnknownInterface urlBack={`/project/${projectRef}/settings/jwt/signing-keys`} />
  }

  return (
    <JWTKeysLayout>
      <JWTSettings />
    </JWTKeysLayout>
  )
}
