import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormField,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  TextArea_Shadcn_,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAnalyticsBucketsQuery } from '@/data/storage/analytics-buckets-query'
import { useIcebergNamespacesQuery } from '@/data/storage/iceberg-namespaces-query'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const BigQueryFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">BigQuery settings</p>
      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Project ID"
              description="The Google Cloud project ID where data will be sent"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="my-gcp-project" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="datasetId"
          render={({ field }) => (
            <FormItemLayout
              label="Dataset ID"
              layout="horizontal"
              description="The BigQuery dataset where replicated tables will be created"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="my_dataset" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="serviceAccountKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Service Account Key"
              description="Service account credentials JSON for authenticating with BigQuery"
            >
              <FormControl>
                <TextArea_Shadcn_
                  {...field}
                  rows={5}
                  maxLength={5000}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  className="font-mono text-xs"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

export const DuckLakeFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const [showCatalogUrl, setShowCatalogUrl] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">DuckLake settings</p>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          Configure the PostgreSQL-backed DuckLake catalog and the S3-compatible storage location
          for replicated data.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeCatalogUrl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Catalog URL"
              description="A PostgreSQL connection string for the DuckLake catalog"
            >
              <FormControl>
                <Input
                  value={field.value ?? ''}
                  type={showCatalogUrl ? 'text' : 'password'}
                  placeholder="postgres://user:pass@host:5432/ducklake_catalog"
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    <div className="flex items-center justify-center">
                      <Button
                        type="default"
                        className="w-7"
                        icon={showCatalogUrl ? <Eye /> : <EyeOff />}
                        onClick={() => setShowCatalogUrl(!showCatalogUrl)}
                      />
                    </div>
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeDataPath"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Data path"
              description="An S3 path where DuckLake data files will be written"
            >
              <FormControl>
                <Input_Shadcn_
                  {...field}
                  placeholder="s3://bucket/path"
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakePoolSize"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Pool size"
              description="Optional number of concurrent DuckDB connections to use"
            >
              <FormControl>
                <Input_Shadcn_
                  type="number"
                  min={1}
                  max={6}
                  value={field.value ?? ''}
                  placeholder="Default: 4"
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Object storage</p>
        <p className="text-sm text-foreground-light">
          Optional credentials and endpoint settings for S3-compatible storage providers.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeS3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Access Key ID"
              description="Required access key ID for the object storage provider"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="my-access-key" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3SecretAccessKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Secret Access Key"
              description="Required secret access key for the object storage provider"
              className="relative"
            >
              <FormControl>
                <Input_Shadcn_
                  {...field}
                  type={showSecretAccessKey ? 'text' : 'password'}
                  placeholder="my-secret-key"
                  value={field.value ?? ''}
                />
              </FormControl>
              <Button
                type="default"
                icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                className="w-7 absolute right-6 top-[4px]"
                onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
              />
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Region"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Region"
              description="Required region for the object storage provider"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="us-east-1" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Endpoint"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Endpoint"
              description="Required endpoint without the protocol scheme, for example `127.0.0.1:5000/s3`"
            >
              <FormControl>
                <Input_Shadcn_
                  {...field}
                  placeholder="127.0.0.1:5000/s3"
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UrlStyle"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 URL style"
              description="Choose `path` for MinIO/Supabase-style endpoints or `vhost` for AWS-style virtual host addressing"
            >
              <FormControl>
                <Select_Shadcn_ value={field.value ?? 'path'} onValueChange={field.onChange}>
                  <SelectTrigger_Shadcn_>{field.value ?? 'path'}</SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectItem_Shadcn_ value="path">path</SelectItem_Shadcn_>
                    <SelectItem_Shadcn_ value="vhost">vhost</SelectItem_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UseSsl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Use SSL"
              description="Whether to use SSL when connecting to the S3-compatible endpoint"
            >
              <FormControl>
                <Select_Shadcn_
                  value={field.value === false ? 'false' : 'true'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                >
                  <SelectTrigger_Shadcn_>
                    {field.value === false ? 'false' : 'true'}
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectItem_Shadcn_ value="true">true</SelectItem_Shadcn_>
                    <SelectItem_Shadcn_ value="false">false</SelectItem_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Maintenance</p>
        <p className="text-sm text-foreground-light">
          Optional settings for DuckLake metadata tables and snapshot cleanup.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeMetadataSchema"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Metadata schema"
              description="Schema used for DuckLake metadata tables in PostgreSQL"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="ducklake" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeExpireSnapshotsOlderThan"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Expire snapshots older than"
              description="Optional snapshot retention interval, for example `7 days`"
            >
              <FormControl>
                <Input_Shadcn_ {...field} placeholder="7 days" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

/**
 * [Joshen] JFYI I'd foresee a possible UX friction point here regarding S3 access key IDs and secret access keys
 * - We'd allow users to select access key IDs via a dropdown here, but require a text input for secret access keys
 * - Chances are most users wouldn't have the corresponding secret access key for the selected key ID at the top of their heads
 * - So highly likely may have to default to "Create a new key" -> which from here they won't know the secret access key thereafter
 * - And it'll end up just creating more keys for each destination
 * Ideal scenario: Just select an access key ID, we then apply the secret access key in the PATCH request, so FE has no
 * context of the secret access key at any point
 */
export const AnalyticsBucketFields = ({
  form,
  setIsFormInteracting,
  onSelectNewBucket,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  setIsFormInteracting: (value: boolean) => void
  onSelectNewBucket: () => void
}) => {
  const { warehouseName, s3AccessKeyId, namespace } = form.watch()
  const [showCatalogToken, setShowCatalogToken] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  const { ref: projectRef } = useParams()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = getKeys(apiKeys)
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
                  type="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving buckets
                </Button>
              ) : isErrorBuckets ? (
                <Button
                  disabled
                  type="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve buckets
                </Button>
              ) : (
                <FormControl>
                  <Select_Shadcn_
                    value={field.value}
                    onValueChange={(value) => {
                      if (value === 'new-bucket') {
                        onSelectNewBucket()
                      } else {
                        setIsFormInteracting(true)
                        field.onChange(value)
                        // [Joshen] Ideally should select the first namespace of the selected bucket
                        form.setValue('namespace', '')
                      }
                    }}
                  >
                    <SelectTrigger_Shadcn_>
                      {field.value || 'Select a bucket'}
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {analyticsBuckets.length === 0 ? (
                          <SelectItem_Shadcn_ value="__no_buckets__" disabled>
                            No buckets available
                          </SelectItem_Shadcn_>
                        ) : (
                          analyticsBuckets.map((bucket) => (
                            <SelectItem_Shadcn_ key={bucket.name} value={bucket.name}>
                              {bucket.name}
                            </SelectItem_Shadcn_>
                          ))
                        )}
                        <SelectSeparator_Shadcn_ />
                        <SelectItem_Shadcn_ value="new-bucket">
                          Create a new bucket
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
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
                  type="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving namespaces
                </Button>
              ) : isErrorNamespaces ? (
                <Button
                  disabled
                  type="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve namespaces
                </Button>
              ) : (
                <FormControl>
                  <Select_Shadcn_
                    value={field.value}
                    onValueChange={(value) => {
                      setIsFormInteracting(true)
                      field.onChange(value)
                    }}
                    disabled={!canSelectNamespace}
                  >
                    <SelectTrigger_Shadcn_>
                      {!canSelectNamespace
                        ? 'Select a warehouse first'
                        : field.value === CREATE_NEW_NAMESPACE
                          ? 'Create a new namespace'
                          : field.value || 'Select a namespace'}
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {namespaces.length === 0 ? (
                          <SelectItem_Shadcn_ value="__no_namespaces__" disabled>
                            No namespaces available
                          </SelectItem_Shadcn_>
                        ) : (
                          namespaces.map((namespace) => (
                            <SelectItem_Shadcn_ key={namespace} value={namespace}>
                              {namespace}
                            </SelectItem_Shadcn_>
                          ))
                        )}
                        <SelectSeparator_Shadcn_ />
                        <SelectItem_Shadcn_ key={CREATE_NEW_NAMESPACE} value={CREATE_NEW_NAMESPACE}>
                          Create a new namespace
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
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
                  <Input_Shadcn_ {...field} placeholder="new_namespace" value={field.value || ''} />
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
                <>
                  Automatically retrieved from your project's{' '}
                  <InlineLink href={`/project/${projectRef}/settings/api-keys`}>
                    service role key
                  </InlineLink>
                </>
              }
            >
              <Input
                disabled
                value={field.value}
                type={showCatalogToken ? 'text' : 'password'}
                placeholder="Auto-populated"
                actions={
                  serviceApiKey ? (
                    <div className="flex items-center justify-center">
                      <Button
                        type="default"
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
                    <Admonition type="warning" title="Unable to find access key ID in project">
                      <p className="!leading-normal">
                        Please select another key or create a new set, as this destination will not
                        work otherwise. S3 access keys can be managed in your{' '}
                        <InlineLink href={`/project/${projectRef}/storage/files/settings`}>
                          storage settings
                        </InlineLink>
                      </p>
                    </Admonition>
                  )}

                  {s3AccessKeyId === CREATE_NEW_KEY && (
                    <Admonition
                      type="default"
                      title="A new set of S3 access keys will be created"
                    />
                  )}
                </div>
              }
            >
              {isLoadingKeys ? (
                <Button
                  disabled
                  type="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving keys
                </Button>
              ) : isErrorKeys ? (
                <Button
                  disabled
                  type="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve keys
                </Button>
              ) : (
                <FormControl>
                  <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger_Shadcn_>
                      {field.value === CREATE_NEW_KEY
                        ? 'Create a new key'
                        : (field.value ?? '').length === 0
                          ? 'Select an access key ID'
                          : field.value}
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {s3Keys.map((key) => (
                          <SelectItem_Shadcn_ key={key.id} value={key.access_key}>
                            {key.access_key}
                            <p className="text-foreground-lighter">{key.description}</p>
                          </SelectItem_Shadcn_>
                        ))}
                        <SelectSeparator_Shadcn_ />
                        <SelectItem_Shadcn_ key={CREATE_NEW_KEY} value={CREATE_NEW_KEY}>
                          Create a new key
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
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
                description="The secret key corresponding to your selected access key ID"
              >
                <FormControl>
                  <Input_Shadcn_
                    {...field}
                    type={showSecretAccessKey ? 'text' : 'password'}
                    value={field.value ?? ''}
                    placeholder="Provide the secret access key"
                  />
                </FormControl>
                <Button
                  type="default"
                  icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                  className="w-7 absolute right-6 top-[4px]"
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
