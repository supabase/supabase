import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Card, CardContent, EyeOffIcon, Skeleton, WarningIcon } from 'ui'

import { ScaffoldSection } from 'components/layouts/Scaffold'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

// to add in later with follow up PR
// import CreatePublishableAPIKeyDialog from './CreatePublishableAPIKeyDialog'
// to add in later with follow up PR
// import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'

export const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const {
    data: apiKeysData,
    isLoading: isLoadingApiKeys,
    error,
  } = useAPIKeysQuery({ projectRef, reveal: false })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  const { can: canReadAPIKeys, isLoading: isPermissionsLoading } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )

  // The default publisahble key will always be the first one
  const apiKey = publishableApiKeys[0]

  return (
    <ScaffoldSection isFullWidth className="!pt-0">
      <FormHeader
        title="Publishable key"
        description="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies."
      />
      <Card>
        <CardContent>
          <FormItemLayout
            layout="horizontal"
            label="Publishable key"
            description={
              error && canReadAPIKeys
                ? `Failed to load publishable key: ${error?.message}`
                : 'This publishable key can be safely shared publicly.'
            }
            isReactForm={false}
          >
            {isLoadingApiKeys || isPermissionsLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-48 rounded" />
              </div>
            ) : !canReadAPIKeys ? (
              <div className="flex items-center gap-2 text-foreground-lighter">
                <EyeOffIcon className="h-4 w-4" />
                You do not have permission to read API Key
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-warning">
                <WarningIcon className="h-4 w-4" />
                Failed to load publishable key
              </div>
            ) : (
              <Input
                readOnly
                copy
                value={apiKey?.api_key}
                disabled={isPermissionsLoading || isLoadingApiKeys || !canReadAPIKeys}
              />
            )}
          </FormItemLayout>
        </CardContent>
      </Card>
    </ScaffoldSection>
  )
}
