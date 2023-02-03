import { useRouter } from 'next/router'
import { IconAlertCircle, IconLoader, Input } from 'ui'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { checkPermissions, useJwtSecretUpdateStatus, useProjectSettings } from 'hooks'
import Panel from 'components/ui/Panel'

const DisplayApiSettings = () => {
  const router = useRouter()
  const { ref } = router.query

  const {
    services,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettings(ref as string | undefined)
  const {
    jwtSecretUpdateStatus,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  }: any = useJwtSecretUpdateStatus(ref)

  const canReadAPIKeys = checkPermissions(PermissionAction.READ, 'service_api_keys')

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated
  // Get the API service
  const apiService = (services ?? []).find((x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID)
  const apiKeys = apiService?.service_api_keys ?? []
  // api keys should not be empty. However it can be populated with a delay on project creation
  const isApiKeysEmpty = apiKeys.length === 0

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
      {isProjectSettingsError || isJwtSecretUpdateStatusError ? (
        <div className="flex items-center justify-center space-x-2 py-8">
          <IconAlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsError ? 'Failed to retrieve API keys' : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isApiKeysEmpty || isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
        <div className="flex items-center justify-center space-x-2 py-8">
          <IconLoader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsLoading || isApiKeysEmpty
              ? 'Retrieving API keys'
              : 'JWT secret is being updated'}
          </p>
        </div>
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
              readOnly
              disabled
              layout="horizontal"
              className="input-mono"
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
                      <code className="bg-red-900 text-xs text-white">secret</code>
                    </>
                  )}
                  {x.tags === 'anon' && <code className="text-xs text-code">public</code>}
                </>
              }
              copy={canReadAPIKeys && isNotUpdatingJwtSecret}
              reveal={x.tags !== 'anon' && canReadAPIKeys && isNotUpdatingJwtSecret}
              value={
                !canReadAPIKeys
                  ? 'You need additional permissions to view API keys'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
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
    </Panel>
  )
}
export default DisplayApiSettings
