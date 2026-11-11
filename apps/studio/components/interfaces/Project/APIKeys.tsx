import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { LoaderIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ConnectionIcon } from '@/components/interfaces/Connect/ConnectionIcon'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { apiKeysQueryOptions, getKeys } from '@/data/api-keys/api-keys-query'
import { useLegacyAPIKeysStatusQuery } from '@/data/api-keys/legacy-api-keys-status-query'
import { useJwtSecretUpdatingStatusQuery } from '@/data/config/jwt-secret-updating-status-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useGrant } from '@/lib/grants'

export const APIKeys = () => {
  const { ref: projectRef } = useParams()
  // Shows the publishable (or anon) key, which `reveal=false` returns in full, so a plain grant is enough
  const apiKeysGrant = useGrant('GET /v1/projects/{ref}/api-keys', { projectRef })
  const isGranted = apiKeysGrant.status === 'granted'

  const {
    data: settings,
    error: projectSettingsError,
    isError: isProjectSettingsError,
    isPending: isProjectSettingsLoading,
  } = useProjectSettingsV2Query({ projectRef })

  const { data: legacyAPIKeysStatusData, isPending: isLoadingAPIKeysStatus } =
    useLegacyAPIKeysStatusQuery({ projectRef }, { enabled: isGranted })

  const {
    data: apiKeysData,
    error: errorAPIKeys,
    isError: isErrorAPIKeys,
    isPending: isLoadingAPIKeys,
  } = useQuery(apiKeysQueryOptions({ projectRef, grant: apiKeysGrant.grant }, { select: getKeys }))
  const { anonKey, serviceKey, publishableKey, secretKey } = apiKeysData ?? {}

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

  const isDenied = apiKeysGrant.status === 'denied'
  const isGrantError = apiKeysGrant.status === 'error'
  const isLoading =
    apiKeysGrant.status === 'loading' ||
    isProjectSettingsLoading ||
    (isGranted && (isLoadingAPIKeys || isLoadingAPIKeysStatus))
  const isError =
    isGrantError || isErrorAPIKeys || isProjectSettingsError || isJwtSecretUpdateStatusError

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
      ) : isDenied ? (
        <CardContent>
          <NoPermission resourceText="view API keys" />
        </CardContent>
      ) : isError ? (
        <AlertError
          className="rounded-none border-0"
          subject={
            isGrantError
              ? 'Failed to check API key permissions'
              : isErrorAPIKeys
                ? 'Failed to retrieve API Keys'
                : isProjectSettingsError
                  ? 'Failed to retrieve project settings'
                  : isJwtSecretUpdateStatusError
                    ? 'Failed to update JWT secret'
                    : ''
          }
          error={
            (isGrantError ? apiKeysGrant.error : undefined) ??
            errorAPIKeys ??
            projectSettingsError ??
            jwtSecretUpdateError
          }
        />
      ) : showJwtLoading ? (
        <CardContent>
          <div className="flex items-center justify-center py-4 space-x-2">
            <LoaderIcon className="animate-spin" size={16} strokeWidth={1.5} />
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
                      <code>{anonKey?.name}</code>
                      <code>public</code>
                    </div>
                  </div>
                )
              }
              description={
                <p>
                  This key is safe to use in a browser if you have enabled Row Level Security (RLS)
                  for your tables and configured policies. You may also use the{' '}
                  {hasNewAPIKeys ? <span>secret</span> : <span>service</span>}{' '}
                  <span>key which can be found</span>{' '}
                  <InlineLink
                    href={`/project/${projectRef}/settings/api-keys${!hasNewAPIKeys ? '/legacy' : ''}`}
                  >
                    here
                  </InlineLink>{' '}
                  <span>to bypass RLS.</span>
                </p>
              }
            >
              <Input
                readOnly
                className="input-mono"
                copy={isNotUpdatingJwtSecret}
                reveal={anonKey?.name !== 'anon' && isNotUpdatingJwtSecret}
                value={
                  jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                    ? 'JWT secret update failed, new API key may have issues'
                    : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                      ? 'Updating JWT secret...'
                      : (publishableKey?.api_key ?? anonKey?.api_key)
                }
              />
            </FormItemLayout>
          </CardContent>

          <CardContent className="relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-md -mt-px"
              style={{
                backgroundImage: `
                  linear-gradient(to top, oklch(from var(--background-surface-100) l c h / 1) 0%, oklch(from var(--background-surface-100) l c h / 1) 30%, oklch(from var(--background-surface-75) l c h / 0) 100%),
                  linear-gradient(to right, oklch(from var(--border-default) l c h / 0.33) 1px, transparent 1px),
                  linear-gradient(to bottom, oklch(from var(--border-default) l c h / 0.33) 1px, transparent 1px)
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
