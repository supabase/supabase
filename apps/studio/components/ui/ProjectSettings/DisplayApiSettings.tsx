import { PermissionAction } from '@supabase/shared-types/out/constants'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { Input } from 'ui'
import { getLastUsedAPIKeys, useLastUsedAPIKeysLogQuery } from './DisplayApiSettings.utils'
import { ToggleLegacyApiKeysPanel } from './ToggleLegacyApiKeys'
import Link from 'next/link'

export const DisplayApiSettings = ({
  showTitle = true,
  showNotice = true,
  showLegacyText = true,
}: {
  showTitle?: boolean
  showNotice?: boolean
  showLegacyText?: boolean
}) => {
  const { ref: projectRef } = useParams()

  const newApiKeysInRollOut = useFlag('basicApiKeys')

  const {
    data: settings,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettingsV2Query({ projectRef })
  const {
    data,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const { isLoading: isLoadingPermissions, can: canReadAPIKeys } = useAsyncCheckProjectPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const isLoading = isProjectSettingsLoading || isLoadingPermissions

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated
  const apiKeys = useMemo(() => settings?.service_api_keys ?? [], [settings])
  // api keys should not be empty. However it can be populated with a delay on project creation
  const isApiKeysEmpty = apiKeys.length === 0

  const { isLoading: isLoadingLastUsed, logData: lastUsedLogData } = useLastUsedAPIKeysLogQuery(
    projectRef!
  )

  const lastUsedAPIKeys = useMemo(() => {
    if (apiKeys.length < 1 || !lastUsedLogData || lastUsedLogData.length < 1) {
      return {}
    }

    try {
      return getLastUsedAPIKeys(apiKeys, lastUsedLogData)
    } catch (e: any) {
      toast.error('Failed to identify when the anon and service_role keys were last used')
      console.error(e)
      return {}
    }
  }, [lastUsedLogData, apiKeys])

  return (
    <>
      <Panel
        noMargin
        title={
          showTitle && (
            <div className="space-y-3">
              <h5 className="text-base">Project API Keys</h5>
              <p className="text-sm text-foreground-light">
                Your API is secured behind an API gateway which requires an API Key for every
                request.
                <br />
                You can use the keys below in the Supabase client libraries.
                <br />
              </p>
            </div>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">Retrieving API keys</p>
          </div>
        ) : !canReadAPIKeys ? (
          <div className="flex items-center py-8 px-8 space-x-2">
            <AlertCircle size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">
              You don't have permission to view API keys. These keys restricted to users with higher
              access levels.
            </p>
          </div>
        ) : isProjectSettingsError || isJwtSecretUpdateStatusError ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <AlertCircle size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">
              {isProjectSettingsError
                ? 'Failed to retrieve API keys'
                : 'Failed to update JWT secret'}
            </p>
          </div>
        ) : isApiKeysEmpty || isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">
              {isProjectSettingsLoading || isApiKeysEmpty
                ? 'Retrieving API keys'
                : 'JWT secret is being updated'}
            </p>
          </div>
        ) : (
          apiKeys.map((x, i: number) => (
            <Panel.Content
              key={x.api_key}
              className={
                i >= 1 &&
                'border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark'
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
                    {x.tags?.split(',').map((x, i: number) => (
                      <code key={`${x}${i}`} className="text-xs text-code">
                        {x}
                      </code>
                    ))}
                    {x.tags === 'service_role' && (
                      <>
                        <code className="text-xs text-code !bg-destructive !text-white !border-destructive">
                          secret
                        </code>
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
                        : x?.api_key ?? 'You need additional permissions to view API keys'
                }
                onChange={() => {}}
                descriptionText={
                  x.tags === 'service_role' ? (
                    <>
                      This key has the ability to bypass Row Level Security. Never share it
                      publicly. If leaked, generate a new JWT secret immediately.{' '}
                      {showLegacyText && (
                        <span>
                          Prefer using{' '}
                          <Link
                            href={`/project/${projectRef}/settings/api-keys/new`}
                            className="text-link underline"
                          >
                            Secret API keys
                          </Link>{' '}
                          instead.
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      This key is safe to use in a browser if you have enabled Row Level Security
                      for your tables and configured policies.{' '}
                      {showLegacyText && (
                        <span>
                          Prefer using{' '}
                          <Link
                            href={`/project/${projectRef}/settings/api-keys/new`}
                            className="text-link underline"
                          >
                            Publishable API keys
                          </Link>{' '}
                          instead.
                        </span>
                      )}
                    </>
                  )
                }
              />

              <div
                className="pt-2 text-foreground-lighter w-full text-sm data-[invisible=true]:invisible"
                data-invisible={isLoadingLastUsed}
              >
                {lastUsedAPIKeys[x.api_key]
                  ? `Last request was ${lastUsedAPIKeys[x.api_key]} ago.`
                  : 'No requests in the past 24 hours.'}
              </div>
            </Panel.Content>
          ))
        )}
        {showNotice ? (
          newApiKeysInRollOut ? (
            <Panel.Notice
              className="border-t"
              title="API keys have moved"
              badgeLabel={'Changelog'}
              description={`
  \`anon\` and \`service_role\` API keys can now be replaced with \`publishable\` and \`secret\` API keys.
  `}
              href="https://github.com/orgs/supabase/discussions/29260"
              buttonText="Read the announcement"
            />
          ) : (
            <Panel.Notice
              className="border-t"
              title="New API keys coming Q2 2025"
              description={`
\`anon\` and \`service_role\` API keys will be changing to \`publishable\` and \`secret\` API keys.
`}
              href="https://github.com/orgs/supabase/discussions/29260"
              buttonText="Read the announcement"
            />
          )
        ) : null}
      </Panel>
      {newApiKeysInRollOut && !showNotice && <ToggleLegacyApiKeysPanel />}
    </>
  )
}
