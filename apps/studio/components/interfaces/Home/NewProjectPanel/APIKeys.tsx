import { PermissionAction } from '@supabase/shared-types/out/constants'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useLegacyAPIKeysStatusQuery } from 'data/api-keys/legacy-api-keys-status-query'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Loader } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ConnectionIcon } from '@/components/interfaces/Connect/ConnectionIcon'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'

export const APIKeys = () => {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const {
    data: settings,
    error: projectSettingsError,
    isError: isProjectSettingsError,
    isPending: isProjectSettingsLoading,
  } = useProjectSettingsV2Query({ projectRef })

  const { data: legacyAPIKeysStatusData, isPending: isLoadingAPIKeysStatus } =
    useLegacyAPIKeysStatusQuery({ projectRef }, { enabled: canReadAPIKeys })

  const {
    data: apiKeys,
    error: errorAPIKeys,
    isError: isErrorAPIKeys,
    isPending: isLoadingAPIKeys,
  } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { anonKey, serviceKey, publishableKey, secretKey } = getKeys(apiKeys)

  const hasNewAPIKeys = !!publishableKey && !!secretKey
  const isLegacyKeysEnabled = legacyAPIKeysStatusData?.enabled ?? false
  const isApiKeysEmpty = !hasNewAPIKeys && !anonKey && !serviceKey

  const {
    data,
    error: jwtSecretUpdateError,
    isError: isJwtSecretUpdateStatusError,
    isPending: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery(
    { projectRef },
    { enabled: !isProjectSettingsLoading && isApiKeysEmpty }
  )

  const isLoading = isLoadingAPIKeys || isLoadingAPIKeysStatus || isProjectSettingsLoading
  const isError = isErrorAPIKeys || isProjectSettingsError || isJwtSecretUpdateStatusError

  // Only show JWT loading state if the query is actually enabled
  const showJwtLoading =
    isJwtSecretUpdateStatusLoading && !isProjectSettingsLoading && isApiKeysEmpty

  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint ?? '-'}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Project API</CardTitle>
        <CardDescription>
          Your API is secured behind an API gateway which requires an API Key for every request.
          <br />
          You can use the parameters below to use Supabase client libraries.
        </CardDescription>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <GenericSkeletonLoader />
        </CardContent>
      ) : isError ? (
        <AlertError
          className="rounded-none border-0"
          subject={
            isErrorAPIKeys
              ? 'Failed to retrieve API Keys'
              : isProjectSettingsError
                ? 'Failed to retrieve project settings'
                : isJwtSecretUpdateStatusError
                  ? 'Failed to update JWT secret'
                  : ''
          }
          error={errorAPIKeys ?? projectSettingsError ?? jwtSecretUpdateError}
        />
      ) : showJwtLoading ? (
        <CardContent>
          <div className="flex items-center justify-center py-4 space-x-2">
            <Loader className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">JWT secret is being updated</p>
          </div>
        </CardContent>
      ) : !isLegacyKeysEnabled && !hasNewAPIKeys ? (
        <Admonition
          type="default"
          className="border-0 rounded-none"
          title="Project has no API keys created yet"
          description={
            <>
              Create a set of API keys from your{' '}
              <InlineLink href={`/project/${projectRef}/settings/api-keys`}>
                project settings
              </InlineLink>{' '}
              to connect to your project
            </>
          }
        />
      ) : (
        <>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label="Project URL"
              description="A RESTful endpoint for querying and managing your database."
            >
              <Input readOnly copy className="input-mono" value={apiUrl} />
            </FormItemLayout>
          </CardContent>

          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label={
                hasNewAPIKeys ? (
                  'Publishable API Key'
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">API Key</p>
                    <div className="flex items-center space-x-1 -ml-1">
                      <code className="text-code-inline">{anonKey?.name}</code>
                      <code className="text-code-inline">public</code>
                    </div>
                  </div>
                )
              }
              description={
                <p>
                  This key is safe to use in a browser if you have enabled Row Level Security (RLS)
                  for your tables and configured policies. You may also use the{' '}
                  {hasNewAPIKeys ? 'secret' : 'service'} key which can be found{' '}
                  <InlineLink
                    href={`/project/${projectRef}/settings/api-keys${!hasNewAPIKeys ? '/legacy' : ''}`}
                  >
                    here
                  </InlineLink>{' '}
                  to bypass RLS.
                </p>
              }
            >
              <Input
                readOnly
                className="input-mono"
                copy={canReadAPIKeys && isNotUpdatingJwtSecret}
                reveal={anonKey?.name !== 'anon' && canReadAPIKeys && isNotUpdatingJwtSecret}
                value={
                  !canReadAPIKeys
                    ? 'You need additional permissions to view API keys'
                    : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                      ? 'JWT secret update failed, new API key may have issues'
                      : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                        ? 'Updating JWT secret...'
                        : publishableKey?.api_key ?? anonKey?.api_key
                }
              />
            </FormItemLayout>
          </CardContent>

          <CardContent className="relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-md -mt-[1px]"
              style={{
                backgroundImage: `
                  linear-gradient(to top, hsl(var(--background-surface-100)/1) 0%, hsl(var(--background-surface-100)/1) 30%, hsl(var(--background-surface-75)/0) 100%),
                  linear-gradient(to right, hsl(var(--border-default)/0.33) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border-default)/0.33) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 15px 15px, 15px 15px',
                backgroundPosition: '0 0, 0 0, 0 0',
              }}
            />
            <div className="relative mt-6 mb-3">
              <div className="flex gap-x-3.5 relative ml-0.5 mb-4 opacity-80">
                <ConnectionIcon icon="nextjs" size={26} />
                <ConnectionIcon icon="react" size={26} />
                <ConnectionIcon icon="svelte" size={22} />
                <ConnectionIcon icon="flutter" size={23} />
                <ConnectionIcon icon="prisma" size={22} />
              </div>
              <p className="mb-1">Choose your preferred framework</p>
              <p className="text-sm text-foreground-light mb-4 md:mr-20 text-balance">
                Connect to your project from a variety of frameworks, ORMs, an MCP server, or even
                directly via connection string.
              </p>
              <ConnectButton />
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}
