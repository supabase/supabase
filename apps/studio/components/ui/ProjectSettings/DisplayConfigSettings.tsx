import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { AlertCircle, Loader } from 'lucide-react'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { Input } from 'ui'

const DisplayConfigSettings = () => {
  const { ref: projectRef } = useParams()
  const {
    data: settings,
    isLoading: isProjectSettingsLoading,
    isError: isProjectSettingsError,
  } = useProjectSettingsV2Query({
    projectRef,
  })
  const { data: config, isError: isPostgrestError } = useProjectPostgrestConfigQuery({ projectRef })

  const {
    data,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus
  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated

  const jwtSecret = config?.jwt_secret ?? ''
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = endpoint ? `${protocol}://${endpoint}` : '-'

  return (
    <ConfigContentWrapper>
      {isProjectSettingsError || isPostgrestError || isJwtSecretUpdateStatusError ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <AlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">
            {isProjectSettingsError || isPostgrestError
              ? 'Failed to retrieve configuration'
              : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isProjectSettingsLoading || isPostgrestError || isJwtSecretUpdateStatusLoading ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <Loader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">
            {isProjectSettingsLoading ? 'Retrieving API keys' : 'JWT secret is being updated'}
          </p>
        </div>
      ) : (
        <>
          <Panel.Content>
            <Input
              label="URL"
              readOnly
              copy
              disabled
              className="input-mono"
              value={apiUrl}
              descriptionText="A RESTful endpoint for querying and managing your database."
              layout="horizontal"
            />
          </Panel.Content>
          <Panel.Content className="border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
            <Input
              label="JWT Secret"
              readOnly
              copy={isNotUpdatingJwtSecret}
              reveal={isNotUpdatingJwtSecret}
              disabled
              value={
                jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                  ? 'JWT secret update failed'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                    ? 'Updating JWT secret...'
                    : jwtSecret
              }
              className="input-mono"
              descriptionText="Used to decode your JWTs. You can also use this to mint your own JWTs."
              layout="horizontal"
            />
          </Panel.Content>
        </>
      )}
    </ConfigContentWrapper>
  )
}

export default DisplayConfigSettings

const ConfigContentWrapper = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Panel
      title={
        <div className="space-y-3">
          <h5 className="text-base">Project Configuration</h5>
        </div>
      }
    >
      {children}
    </Panel>
  )
}
