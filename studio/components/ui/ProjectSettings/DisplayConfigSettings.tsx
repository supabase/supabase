import { FC } from 'react'
import { useRouter } from 'next/router'
import { Input } from '@supabase/ui'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useJwtSecretUpdateStatus, useProjectSettings } from 'hooks'
import { SettingsLoadingState } from './SettingsLoadingState'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import Panel from 'components/to-be-cleaned/Panel'

const DisplayConfigSettings = () => {
  const router = useRouter()
  const { ref } = router.query
  const {
    project,
    services,
    isLoading: isProjectSettingsLoading,
    isError: isProjectSettingsError,
  } = useProjectSettings(ref as string | undefined)
  const {
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
    jwtSecretUpdateStatus,
  }: any = useJwtSecretUpdateStatus(ref)

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated
  // Get the API service
  const jwtSecret = project?.jwt_secret ?? ''
  const apiService = (services ?? []).find((x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID)
  const apiConfig = apiService?.app_config ?? {}

  return (
    <ConfigContentWrapper>
      {isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
        <SettingsLoadingState
          isError={isProjectSettingsError || isJwtSecretUpdateStatusError}
          errorMessage="Failed to fetch project configuration"
        />
      ) : (
        <>
          <Panel.Content>
            <Input
              label="URL"
              readOnly
              copy
              disabled
              className="input-mono"
              value={`https://${apiConfig.endpoint}`}
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
