import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import * as z from 'zod'

import { useParams } from 'common'
import { getCatalogURI } from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DestinationPanelFormSchema } from './DestinationPanel.schema'

type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>

export const BigQueryFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  return (
    <>
      <FormField_Shadcn_
        control={form.control}
        name="projectId"
        render={({ field }) => (
          <FormItemLayout
            label="Project ID"
            layout="vertical"
            description="Which BigQuery project to send data to"
          >
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} placeholder="Project ID" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="datasetId"
        render={({ field }) => (
          <FormItemLayout label="Project's Dataset ID" layout="vertical">
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} placeholder="Dataset ID" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="serviceAccountKey"
        render={({ field }) => (
          <FormItemLayout
            label="Service Account Key"
            layout="vertical"
            description="The service account key for BigQuery"
          >
            <FormControl_Shadcn_>
              <TextArea_Shadcn_
                {...field}
                rows={4}
                maxLength={5000}
                placeholder="Service account key"
              />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </>
  )
}

export const AnalyticsBucketFields = ({
  form,
  setIsFormInteracting,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  setIsFormInteracting: (value: boolean) => void
}) => {
  const { warehouseName, type } = form.watch()

  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { serviceKey } = getKeys(apiKeys)
  const serviceApiKey = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const {
    data: buckets = [],
    isLoading: isLoadingBuckets,
    isError: isErrorBuckets,
  } = useBucketsQuery({ projectRef })

  // Construct catalog URI for iceberg namespaces query
  const catalogUri = useMemo(() => {
    if (!project?.ref || !projectSettings) return ''
    const protocol = projectSettings.app_config?.protocol ?? 'https'
    const endpoint =
      projectSettings.app_config?.storage_endpoint || projectSettings.app_config?.endpoint
    return getCatalogURI(project.ref, protocol, endpoint)
  }, [project?.ref, projectSettings])

  const { data: namespaces = [], isLoading: isLoadingNamespaces } = useIcebergNamespacesQuery(
    {
      catalogUri,
      warehouse: warehouseName || '',
      token: serviceApiKey || '',
    },
    {
      enabled: type === 'Analytics Bucket' && !!catalogUri && !!warehouseName && !!serviceApiKey,
    }
  )

  return (
    <>
      <FormField_Shadcn_
        control={form.control}
        name="warehouseName"
        render={({ field }) => (
          <FormItemLayout
            label="Warehouse Name"
            layout="vertical"
            description="Select a storage bucket to use as your Analytics Bucket warehouse"
          >
            <FormControl_Shadcn_>
              <Select_Shadcn_
                value={field.value}
                onValueChange={(value) => {
                  setIsFormInteracting(true)
                  field.onChange(value)
                }}
              >
                <SelectTrigger_Shadcn_>{field.value || 'Select a warehouse'}</SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {isLoadingBuckets ? (
                      <SelectItem_Shadcn_ value="__loading__" disabled>
                        Loading buckets...
                      </SelectItem_Shadcn_>
                    ) : isErrorBuckets ? (
                      <SelectItem_Shadcn_ value="__no_buckets__" disabled>
                        Failed to fetch buckets
                      </SelectItem_Shadcn_>
                    ) : buckets.length === 0 ? (
                      <SelectItem_Shadcn_ value="__no_buckets__" disabled>
                        No buckets available
                      </SelectItem_Shadcn_>
                    ) : (
                      buckets.map((bucket) => (
                        <SelectItem_Shadcn_ key={bucket.id} value={bucket.name}>
                          {bucket.name}
                        </SelectItem_Shadcn_>
                      ))
                    )}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="namespace"
        render={({ field }) => (
          <FormItemLayout
            label="Namespace"
            layout="vertical"
            description="Select a namespace from your Analytics Bucket warehouse"
          >
            <FormControl_Shadcn_>
              <Select_Shadcn_
                value={field.value}
                onValueChange={field.onChange}
                disabled={!warehouseName || !serviceApiKey}
              >
                <SelectTrigger_Shadcn_>
                  {!warehouseName || !serviceApiKey
                    ? 'Select warehouse first'
                    : field.value || 'Select a namespace'}
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {!warehouseName || !serviceApiKey ? (
                      <SelectItem_Shadcn_ value="__disabled__" disabled>
                        Select warehouse first
                      </SelectItem_Shadcn_>
                    ) : isLoadingNamespaces ? (
                      <SelectItem_Shadcn_ value="__loading__" disabled>
                        Loading namespaces...
                      </SelectItem_Shadcn_>
                    ) : namespaces.length === 0 ? (
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
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </>
  )
}
