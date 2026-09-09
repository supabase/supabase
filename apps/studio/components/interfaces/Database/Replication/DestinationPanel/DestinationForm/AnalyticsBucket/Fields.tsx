import { useParams } from 'common'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
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
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SelectionListState } from 'ui-patterns/SelectionListState'

import {
  CREATE_NEW_KEY,
  CREATE_NEW_NAMESPACE,
  STORED_SECRET_PLACEHOLDER,
} from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  useRefreshOnOpen,
} from '../useRefreshOnOpen'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAnalyticsBucketsQuery } from '@/data/storage/analytics-buckets-query'
import { useIcebergNamespacesQuery } from '@/data/storage/iceberg-namespaces-query'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'

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

const getNamespaceTriggerLabel = ({
  canSelectNamespace,
  value,
}: {
  canSelectNamespace: boolean
  value: string | undefined
}) => {
  if (!canSelectNamespace) return 'Select a bucket first'
  if (value === CREATE_NEW_NAMESPACE) return 'Create a new namespace'

  return value || 'Select a namespace'
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
  const [warehouseName, s3AccessKeyId, namespace] = useWatch({
    control: form.control,
    name: ['warehouseName', 's3AccessKeyId', 'namespace'],
  })
  const [showCatalogToken, setShowCatalogToken] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  const { ref: projectRef } = useParams()

  const {
    data: keysData,
    isSuccess: isSuccessKeys,
    isPending: isPendingKeys,
    isFetching: isFetchingKeys,
    isError: isErrorKeys,
    refetch: refetchKeys,
  } = useStorageCredentialsQuery({ projectRef })
  const s3Keys = keysData?.data ?? []
  const isLoadingKeys = isMetadataListLoading(isPendingKeys || isFetchingKeys, s3Keys.length)
  const isKeysErrorVisible = isMetadataListErrorVisible(isErrorKeys, s3Keys.length)
  const keyNoLongerExists =
    (s3AccessKeyId ?? '').length > 0 &&
    s3AccessKeyId !== CREATE_NEW_KEY &&
    !s3Keys.find((k) => k.access_key === s3AccessKeyId)

  const {
    data: analyticsBuckets = [],
    isPending: isPendingBuckets,
    isFetching: isFetchingBuckets,
    isError: isErrorBuckets,
    refetch: refetchBuckets,
  } = useAnalyticsBucketsQuery({ projectRef })
  const isLoadingBuckets = isMetadataListLoading(
    isPendingBuckets || isFetchingBuckets,
    analyticsBuckets.length
  )
  const isBucketsErrorVisible = isMetadataListErrorVisible(isErrorBuckets, analyticsBuckets.length)

  const canSelectNamespace = !!warehouseName

  const {
    data: namespaces = [],
    isPending: isPendingNamespaces,
    isFetching: isFetchingNamespaces,
    isError: isErrorNamespaces,
    refetch: refetchNamespaces,
  } = useIcebergNamespacesQuery(
    { projectRef, warehouse: warehouseName },
    { enabled: !!warehouseName }
  )
  const isLoadingNamespaces = isMetadataListLoading(
    isPendingNamespaces || isFetchingNamespaces,
    namespaces.length
  )
  const isNamespacesErrorVisible = isMetadataListErrorVisible(isErrorNamespaces, namespaces.length)
  const { handleOpenChange: handleRefreshBucketsOnOpen } = useRefreshOnOpen({
    refetch: refetchBuckets,
  })
  const { handleOpenChange: handleRefreshNamespacesOnOpen } = useRefreshOnOpen({
    isEnabled: canSelectNamespace,
    refetch: refetchNamespaces,
  })
  const { handleOpenChange: handleRefreshKeysOnOpen } = useRefreshOnOpen({
    refetch: refetchKeys,
  })

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
              <FormControl>
                <Select
                  value={field.value}
                  onOpenChange={handleRefreshBucketsOnOpen}
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
                      <SelectionListState
                        isLoading={isLoadingBuckets}
                        isError={isBucketsErrorVisible}
                        isEmpty={
                          !isLoadingBuckets &&
                          !isBucketsErrorVisible &&
                          analyticsBuckets.length === 0
                        }
                        emptyLabel="No buckets available"
                        errorLabel="Unable to load buckets"
                      />
                      {analyticsBuckets.map((bucket) => (
                        <SelectItem key={bucket.name} value={bucket.name}>
                          {bucket.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value="new-bucket">Create a new bucket</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
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
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!canSelectNamespace}
                  onOpenChange={handleRefreshNamespacesOnOpen}
                >
                  <SelectTrigger>
                    {getNamespaceTriggerLabel({ canSelectNamespace, value: field.value })}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectionListState
                        isLoading={isLoadingNamespaces}
                        isError={isNamespacesErrorVisible}
                        isEmpty={
                          !isLoadingNamespaces &&
                          !isNamespacesErrorVisible &&
                          namespaces.length === 0
                        }
                        emptyLabel="No namespaces available"
                        errorLabel="Unable to load namespaces"
                      />
                      {namespaces.map((namespace) => (
                        <SelectItem key={namespace} value={namespace}>
                          {namespace}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem key={CREATE_NEW_NAMESPACE} value={CREATE_NEW_NAMESPACE}>
                        Create a new namespace
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />

        {namespace === CREATE_NEW_NAMESPACE && (
          <FormField
            control={form.control}
            name="newNamespaceName"
            render={({ field }) => (
              <FormItemLayout
                label="New namespace name"
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
              label="Catalog token"
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
                  field.value ? (
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
              label="S3 access key ID"
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
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  onOpenChange={handleRefreshKeysOnOpen}
                >
                  <SelectTrigger>
                    {getS3AccessKeyTriggerLabel({ value: field.value, editMode })}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectionListState
                        isLoading={isLoadingKeys}
                        isError={isKeysErrorVisible}
                        isEmpty={!isLoadingKeys && !isKeysErrorVisible && s3Keys.length === 0}
                        emptyLabel="No access keys available"
                        errorLabel="Unable to load access keys"
                      />
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
                label="S3 secret access key"
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
