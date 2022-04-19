import { FC } from 'react'
import { useRouter } from 'next/router'
import { Input } from '@supabase/ui'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useJwtSecretUpdateStatus, useProjectSettings } from 'hooks'
import { SettingsLoadingState } from './SettingsLoadingState'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import Panel from 'components/to-be-cleaned/Panel'

const DisplayApiSettings = () => {
  const router = useRouter()
  const { ref } = router.query
  const {
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
  const apiService = (services ?? []).find((x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID)
  const apiKeys = apiService?.service_api_keys ?? []
  // api keys should not be empty. However it can be populated with a delay on project creation
  const isApikeysEmpty = apiKeys.length === 0

  return (
    <ApiContentWrapper>
      {isProjectSettingsLoading || isJwtSecretUpdateStatusLoading || isApikeysEmpty ? (
        <SettingsLoadingState
          isError={isProjectSettingsError || isJwtSecretUpdateStatusError}
          errorMessage="Failed to fetch API keys"
        />
      ) : (
        apiKeys.map((x: any, i: number) => (
          <Panel.Content
            key={x.api_key}
            className={
              i >= 1 &&
              'border-t border-panel-border-interior-light dark:border-panel-border-interior-dark'
            }
          >
            <Input
              layout="horizontal"
              // @ts-ignore
              label={
                <>
                  {x.tags?.split(',').map((x: any, i: number) => (
                    <code key={`${x}${i}`} className="text-xs text-code">
                      {x}
                    </code>
                  ))}
                  {x.tags === 'service_role' && (
                    <>
                      <code className="text-xs bg-red-900 text-white">{'secret'}</code>
                    </>
                  )}
                  {x.tags === 'anon' && <code className="text-xs text-code">{'public'}</code>}
                </>
              }
              readOnly
              copy={isNotUpdatingJwtSecret}
              className="input-mono"
              disabled
              reveal={x.tags !== 'anon' && isNotUpdatingJwtSecret}
              value={
                jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                  ? 'JWT secret update failed, new API key may have issues'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                  ? 'Updating JWT secret...'
                  : x.api_key
              }
              onChange={() => {}}
              descriptionText={
                x.tags === 'service_role'
                  ? 'This key has the ability to bypass Row Level Security. Never share it publicly.'
                  : 'This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies.'
              }
            />
          </Panel.Content>
        ))
      )}
    </ApiContentWrapper>
  )
}
export default DisplayApiSettings

const ApiContentWrapper: FC = ({ children }) => {
  return (
    <Panel
      title={
        <div className="space-y-3">
          <h5 className="text-base">Project API keys</h5>
          <p className="text-sm text-scale-1000">
            Your API is secured behind an API gateway which requires an API Key for every request.
            <br />
            You can use the keys below to use Supabase client libraries.
          </p>
        </div>
      }
    >
      {children}
    </Panel>
  )
}
