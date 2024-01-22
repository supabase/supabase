import { Dispatch, SetStateAction, useEffect } from 'react'

import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { RealtimeConfig } from '../useRealtimeMessages'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const { data: settings } = useProjectApiQuery({ projectRef: config.projectRef })

  const apiService = settings?.autoApiService
  const serviceRoleKey = apiService?.service_api_keys.find((x) => x.name === 'service_role key')
    ? apiService.serviceApiKey
    : undefined

  const anonRoleKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.serviceApiKey
    : undefined

  const { data: postgrestConfig } = useProjectPostgrestConfigQuery({
    projectRef: config.projectRef,
  })
  const jwtSecret = postgrestConfig?.jwt_secret

  const snap = useRoleImpersonationStateSnapshot()

  useEffect(() => {
    let token: string | undefined
    let bearer: string | null = null

    if (
      config.projectRef !== undefined &&
      jwtSecret !== undefined &&
      snap.role !== undefined &&
      snap.role.type === 'postgrest'
    ) {
      token = anonRoleKey
      bearer = getRoleImpersonationJWT(config.projectRef, jwtSecret, snap.role)
    } else {
      token = serviceRoleKey
    }

    if (token) {
      onChangeConfig({ ...config, token, bearer })
    }
  }, [config.projectRef, jwtSecret, serviceRoleKey, snap.role])

  return <RoleImpersonationPopover align="start" variant="connected-on-both" />
}
