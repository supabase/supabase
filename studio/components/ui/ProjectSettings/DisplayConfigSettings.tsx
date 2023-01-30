import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useParams } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { FC } from 'react'
import { IconAlertCircle, IconLoader, Input } from 'ui'

const DisplayConfigSettings = () => {
  const { ref: projectRef } = useParams()
  const {
    data: settings,
    isLoading: isProjectSettingsLoading,
    isError: isProjectSettingsError,
  } = useProjectSettingsQuery({
    projectRef,
  })

  const {
    data,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated
  // Get the API service
  const jwtSecret = settings?.project?.jwt_secret ?? ''
  const apiService = (settings?.services ?? []).find(
    (x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
  const apiConfig = apiService?.app_config
  const apiUrl = `${apiConfig?.protocol ?? 'https'}://${apiConfig?.endpoint ?? '-'}`

  return (
    <ConfigContentWrapper>
      {isProjectSettingsError || isJwtSecretUpdateStatusError ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <IconAlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsError
              ? 'Failed to retrieve configuration'
              : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <IconLoader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
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
          <Panel.Content className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
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

const ConfigContentWrapper: FC = ({ children }) => {
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
