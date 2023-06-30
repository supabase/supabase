import { PermissionAction } from '@supabase/shared-types/out/constants'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { Button, IconAlertCircle, IconBookOpen, IconLoader, Input } from 'ui'

import { useParams } from 'common/hooks'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCheckPermissions } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'

const DisplayApiSettings = () => {
  const { ref: projectRef } = useParams()

  const {
    data: settings,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettingsQuery({ projectRef })
  const {
    data,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated
  // Get the API service
  const apiService = (settings?.services ?? []).find(
    (x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
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
            You can use the keys below in the Supabase client libraries.
            <br />
            <a href="https://supabase.com/docs#client-libraries" target="_blank" rel="noreferrer">
              <Button icon={<IconBookOpen />} type="default" className="mt-4">
                Client Docs
              </Button>
            </a>
          </p>
        </div>
      }
    >
      {isProjectSettingsError || isJwtSecretUpdateStatusError ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <IconAlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsError ? 'Failed to retrieve API keys' : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isApiKeysEmpty || isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
        <div className="flex items-center justify-center py-8 space-x-2">
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
