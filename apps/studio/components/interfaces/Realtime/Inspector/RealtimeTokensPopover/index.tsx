import { Dispatch, SetStateAction, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { IS_PLATFORM } from 'lib/constants'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { RealtimeConfig } from '../useRealtimeMessages'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const snap = useRoleImpersonationStateSnapshot()

  const { data: settings } = useProjectSettingsV2Query({ projectRef: config.projectRef })
  const anonRoleKey = (settings?.service_api_keys ?? []).find((x) => x.tags === 'anon')?.api_key
  const serviceRoleKey = (settings?.service_api_keys ?? []).find(
    (x) => x.tags === 'service_role'
  )?.api_key

  const { data: postgrestConfig } = useProjectPostgrestConfigQuery(
    {
      projectRef: config.projectRef,
    },
    { enabled: IS_PLATFORM }
  )
  const jwtSecret = postgrestConfig?.jwt_secret

  const { mutate: sendEvent } = useSendEventMutation()

  // only send a telemetry event if the user changes the role. Don't send an event during initial render.
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) {
      sendEvent({
        category: 'realtime_inspector',
        action: 'changed_database_role',
        label: 'realtime_inspector_config',
      })
    }
    isMounted.current = true
  }, [snap.role])

  useEffect(() => {
    const triggerUpdateTokenBearer = async () => {
      let token: string | undefined
      let bearer: string | null = null

      if (
        config.projectRef !== undefined &&
        jwtSecret !== undefined &&
        snap.role !== undefined &&
        snap.role.type === 'postgrest'
      ) {
        token = anonRoleKey
        await getRoleImpersonationJWT(config.projectRef, jwtSecret, snap.role)
          .then((b) => (bearer = b))
          .catch((err) => toast.error(`Failed to get JWT for role: ${err.message}`))
      } else {
        token = serviceRoleKey
      }
      if (token) {
        onChangeConfig({ ...config, token, bearer })
      }
    }

    triggerUpdateTokenBearer()
  }, [snap.role, anonRoleKey, serviceRoleKey])

  return <RoleImpersonationPopover align="start" variant="connected-on-both" />
}
