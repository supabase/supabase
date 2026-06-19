import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Dispatch, SetStateAction, useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'

import { RealtimeConfig } from './useRealtimeMessages'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { getTemporaryAPIKey } from '@/data/api-keys/temp-api-keys-query'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from '@/lib/constants'
import { getRoleImpersonationJWT } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const snap = useRoleImpersonationStateSnapshot()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData } = useAPIKeys(
    {
      projectRef: config.projectRef,
      reveal: true,
    },
    { enabled: canReadAPIKeys }
  )
  const { data: postgrestConfig } = useProjectPostgrestConfigQuery(
    { projectRef: config.projectRef },
    { enabled: IS_PLATFORM }
  )

  const jwtSecret = postgrestConfig?.jwt_secret

  const track = useTrack()
  const onRoleUpdated = useEffectEvent(() => {
    track('realtime_inspector_database_role_updated')
  })

  // only send a telemetry event if the user changes the role. Don't send an event during initial render.
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) {
      onRoleUpdated()
    }
    isMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.role])

  useEffect(() => {
    const { anonKey, publishableKey } = apiKeysData ?? {}
    const triggerUpdateTokenBearer = async () => {
      let token: string | undefined
      let bearer: string | null = null

      if (
        config.projectRef !== undefined &&
        jwtSecret !== undefined &&
        snap.role !== undefined &&
        snap.role.type === 'postgrest'
      ) {
        token = publishableKey?.api_key ?? anonKey?.api_key
        await getRoleImpersonationJWT(config.projectRef, jwtSecret, snap.role)
          .then((b) => (bearer = b))
          .catch((err) => toast.error(`Failed to get JWT for role: ${err.message}`))
      } else {
        try {
          const data = await getTemporaryAPIKey({ projectRef: config.projectRef, expiry: 3600 })
          token = data.api_key
        } catch (error) {
          token = publishableKey?.api_key
        }
      }
      if (token) {
        onChangeConfig({ ...config, token, bearer })
      }
    }

    triggerUpdateTokenBearer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.role, apiKeysData])

  return <RoleImpersonationPopover align="start" variant="connected-on-both" />
}
