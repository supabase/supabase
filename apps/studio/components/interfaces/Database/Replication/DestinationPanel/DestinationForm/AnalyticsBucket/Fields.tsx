import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  CREATE_NEW_KEY,
  CREATE_NEW_NAMESPACE,
  STORED_SECRET_PLACEHOLDER,
} from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useAnalyticsBucketsQuery } from '@/data/storage/analytics-buckets-query'
import { useIcebergNamespacesQuery } from '@/data/storage/iceberg-namespaces-query'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

/**
 * [Joshen] JFYI I'd foresee a possible UX friction point here regarding S3 access key IDs and secret access keys
 * - We'd allow users to select access key IDs via a dropdown here, but require a text input for secret access keys
 * - Chances are most users wouldn't have the corresponding secret access key for the selected key ID at the top of their heads
 * - So highly likely may have to default to "Create a new key" -> which from here they won't know the secret access key thereafter
 * - And it'll end up just creating more keys for each destination
 * Ideal scenario: Just select an access key ID, we then apply the secret access key in the PATCH request, so FE has no
 * context of the secret access key at any point
 */
const getS3AccessKeyTriggerLabel = ({
  value,
  editMode,
}: {
  value: string | undefined
  editMode: boolean
}) => {
  if (value === CREATE_NEW_KEY) return 'Create a new key'
  if (!value) return editMode ? STORED_SECRET_PLACEHOLDER : 'Select an access key ID'

  return value
}

export const AnalyticsBucketFields = ({
  form,
  editMode,
  onSelectNewBucket,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
  onSelectNewBucket: () => void
}) => {
  const { warehouseName, s3AccessKeyId, namespace } = form.watch()
  const [showCatalogToken, setShowCatalogToken] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  const { ref: projectRef } = useParams()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = apiKeysData ?? {}
  const serviceApiKey = serviceKey?.api_key ?? ''

  const {
    data: keysData,
    isSuccess: isSuccessKeys,
    isPending: isLoadingKeys,
    isError: isErrorKeys,
  } = useStorageCredentialsQuery({ projectRef })
  const s3Keys = keysData?.data ?? []
  const keyNoLongerExists =
    (s3AccessKeyId ?? '').length > 0 &&
    s3AccessKeyId !== CREATE_NEW_KEY &&
    !s3Keys.find((k) => k.access_key === s3AccessKeyId)

  const {
    data: analyticsBuckets = [],
    isPending: isLoadingBuckets,
    isError: isErrorBuckets,
  } = useAnalyticsBucketsQuery({ projectRef })

  const canSelectNamespace = !!warehouseName && !!serviceApiKey

  const {
    data: namespaces = [],
    isPending: isLoadingNamespaces,
    isError: isErrorNamespaces,
  } = useIcebergNamespacesQuery(
    { projectRef, warehouse: warehouseName },
    { enabled: !!serviceApiKey }
  )

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">Analytics Bucket settings</p>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="warehouseName"
          render={({ field }) => (
            <FormItemLayout
              label="Bucket"
              layout="horizontal"
              description="The Analytics Bucket where data will be stored"
            >
              {isLoadingBuckets ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving buckets
                </Button>
              ) : isErrorBuckets ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve buckets
                </Button>
              ) : (
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value === 'new-bucket') {
                        onSelectNewBucket()
                      } else {
                        field.onChange(value)
                        // [Joshen] Ideally should select the first namespace of the selected bucket
                        form.setValue('namespace', '')
                      }
                    }}
                  >
                    <SelectTrigger>{field.value || 'Select a bucket'}</SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {analyticsBuckets.length === 0 ? (
                          <SelectItem value="__no_buckets__" disabled>
                            No buckets available
                          </SelectItem>
                        ) : (
                          analyticsBuckets.map((bucket) => (
                            <SelectItem key={bucket.name} value={bucket.name}>
                              {bucket.name}
                            </SelectItem>
                          ))
                        )}
                        <SelectSeparator />
                        <SelectItem value="new-bucket">Create a new bucket</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="namespace"
          render={({ field }) => (
            <FormItemLayout
              label="Namespace"
              layout="horizontal"
              description="The namespace within the bucket where tables will be organized"
            >
              {isLoadingNamespaces && canSelectNamespace ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving namespaces
                </Button>
              ) : isErrorNamespaces ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve namespaces
                </Button>
              ) : (
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canSelectNamespace}
                  >
                    <SelectTrigger>
                      {!canSelectNamespace
                        ? 'Select a warehouse first'
                        : field.value === CREATE_NEW_NAMESPACE
                          ? 'Create a new namespace'
                          : field.value || 'Select a namespace'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {namespaces.length === 0 ? (
                          <SelectItem value="__no_namespaces__" disabled>
                            No namespaces available
                          </SelectItem>
                        ) : (
                          namespaces.map((namespace) => (
                            <SelectItem key={namespace} value={namespace}>
                              {namespace}
                            </SelectItem>
                          ))
                        )}
                        <SelectSeparator />
                        <SelectItem key={CREATE_NEW_NAMESPACE} value={CREATE_NEW_NAMESPACE}>
                          Create a new namespace
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        {namespace === CREATE_NEW_NAMESPACE && (
          <FormField
            control={form.control}
            name="newNamespaceName"
            render={({ field }) => (
              <FormItemLayout
                label="New Namespace Name"
                layout="horizontal"
                description="A unique name for the new namespace"
              >
                <FormControl>
                  <Input {...field} placeholder="new_namespace" value={field.value || ''} />
                </FormControl>
              </FormItemLayout>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="catalogToken"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Catalog Token"
              description={
                editMode ? (
                  'Stored catalog token is hidden and kept automatically.'
                ) : (
                  <>
                    Automatically retrieved from your project's{' '}
                    <InlineLink href={`/project/${projectRef}/settings/api-keys`}>
                      service role key
                    </InlineLink>
                  </>
                )
              }
            >
              <PasswordInput
                disabled
                value={field.value}
                type={showCatalogToken ? 'text' : 'password'}
                placeholder={editMode ? STORED_SECRET_PLACEHOLDER : 'Auto-populated'}
                actions={
                  serviceApiKey ? (
                    <div className="flex items-center justify-center">
                      <Button
                        variant="default"
                        className="w-7"
                        icon={showCatalogToken ? <Eye /> : <EyeOff />}
                        onClick={() => setShowCatalogToken(!showCatalogToken)}
                      />
                    </div>
                  ) : null
                }
              />
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="s3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Access Key ID"
              description={
                <div className="flex flex-col gap-y-2">
                  <p>
                    Access keys are managed in your Storage{' '}
                    <InlineLink href={`/project/${projectRef}/storage/s3`}>S3 settings</InlineLink>
                  </p>

                  {isSuccessKeys && keyNoLongerExists && (
                    <Admonition
                      type="warning"
                      title="Unable to find access key ID in project"
                      description={
                        <>
                          Please select another key or create a new set, as this destination will
                          not work otherwise. S3 access keys can be managed in your{' '}
                          <InlineLink href={`/project/${projectRef}/storage/files/settings`}>
                            storage settings
                          </InlineLink>
                          .
                        </>
                      }
                    />
                  )}

                  {s3AccessKeyId === CREATE_NEW_KEY && (
                    <Admonition
                      type="default"
                      description="A new set of S3 access keys will be created."
                    />
                  )}
                </div>
              }
            >
              {isLoadingKeys ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving keys
                </Button>
              ) : isErrorKeys ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve keys
                </Button>
              ) : (
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      {getS3AccessKeyTriggerLabel({ value: field.value, editMode })}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {s3Keys.map((key) => (
                          <SelectItem key={key.id} value={key.access_key}>
                            {key.access_key}
                            <p className="text-foreground-lighter">{key.description}</p>
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem key={CREATE_NEW_KEY} value={CREATE_NEW_KEY}>
                          Create a new key
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        {s3AccessKeyId !== CREATE_NEW_KEY && (
          <FormField
            control={form.control}
            name="s3SecretAccessKey"
            render={({ field }) => (
              <FormItemLayout
                layout="horizontal"
                label="S3 Secret Access Key"
                className="relative"
                description={
                  editMode
                    ? 'Stored secret access key is hidden. Enter a new secret to replace it.'
                    : 'The secret key corresponding to your selected access key ID.'
                }
              >
                <FormControl>
                  <Input
                    {...field}
                    type={showSecretAccessKey ? 'text' : 'password'}
                    value={field.value ?? ''}
                    placeholder={
                      editMode ? STORED_SECRET_PLACEHOLDER : 'Provide the secret access key'
                    }
                  />
                </FormControl>
                <Button
                  variant="default"
                  icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                  className="w-7 absolute right-1 top-[4px]"
                  onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
                />
              </FormItemLayout>
            )}
          />
        )}
      </div>
    </div>
  )
}
