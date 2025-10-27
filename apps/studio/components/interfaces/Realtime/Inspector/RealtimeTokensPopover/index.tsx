import { Dispatch, SetStateAction, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { getTemporaryAPIKey } from 'data/api-keys/temp-api-keys-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { RealtimeConfig } from '../useRealtimeMessages'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useRoleImpersonationStateSnapshot()

  const { data: apiKeys } = useAPIKeysQuery({
    projectRef: config.projectRef,
    reveal: true,
  })
  const { anonKey, publishableKey } = getKeys(apiKeys)

  const { data: postgrestConfig } = useProjectPostgrestConfigQuery(
    { projectRef: config.projectRef },
    { enabled: IS_PLATFORM }
  )

  const jwtSecret = postgrestConfig?.jwt_secret

  const { mutate: sendEvent } = useSendEventMutation()

  // only send a telemetry event if the user changes the role. Don't send an event during initial render.
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) {
      sendEvent({
        action: 'realtime_inspector_database_role_updated',
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
    }
    isMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [snap.role, anonKey])

  return <RoleImpersonationPopover align="start" variant="connected-on-both" />
}
