import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { getCatalogURI } from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCreateDestinationPipelineMutation } from 'data/etl/create-destination-pipeline-mutation'
import { useCreatePublicationMutation } from 'data/etl/create-publication-mutation'
import { useReplicationSourcesQuery } from 'data/etl/sources-query'
import { useStartPipelineMutation } from 'data/etl/start-pipeline-mutation'
import { useIcebergNamespaceCreateMutation } from 'data/storage/iceberg-namespace-create-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { getDecryptedValues } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import { getAnalyticsBucketPublicationName } from './AnalyticsBucketDetails.utils'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'

/**
 * [Joshen] So far this is purely just setting up a "Connect from empty state" flow
 * Doing it bit by bit as this is quite an unknown territory, will adjust as we figure out
 * limitations, correctness, etc, etc. ETL is also only available on staging so its quite hard
 * to test things locally (Local set up is technically available but quite high friction)
 *
 * What's missing afaict:
 * - Deleting namespaces
 * - Removing tables
 * - Adding more tables
 * - Error handling due to multiple async processes
 */

const FormSchema = z.object({
  tables: z.array(z.string()).min(1, 'At least one table is required'),
})

const formId = 'connect-tables-form'
const isEnabled = false // Kill switch if we wanna hold off supporting connecting tables

type ConnectTablesForm = z.infer<typeof FormSchema>

export const ConnectTablesDialog = ({ bucketId }: { bucketId?: string }) => {
  const form = useForm<ConnectTablesForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { tables: [] },
  })

  const [visible, setVisible] = useState(false)
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({ bucketId: bucketId })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })
  const { data: apiKeys } = useAPIKeysQuery({ projectRef, reveal: true })
  const { serviceKey } = getKeys(apiKeys)

  const { data: tables } = useTablesQuery({
    projectRef,
    connectionString: project?.connectionString,
    includeColumns: false,
  })

  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const { mutateAsync: createNamespace, isLoading: isCreatingNamespace } =
    useIcebergNamespaceCreateMutation()

  const { mutateAsync: createPublication, isLoading: isCreatingPublication } =
    useCreatePublicationMutation()

  const { mutateAsync: createDestinationPipeline, isLoading: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onSuccess: () => {},
    })

  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  const isConnecting = isCreatingNamespace || creatingDestinationPipeline || isCreatingPublication

  const onSubmit: SubmitHandler<ConnectTablesForm> = async (values) => {
    // [Joshen] Currently creates the destination for the analytics bucket here
    // Which also involves creating a namespace + publication
    // Publication name is automatically generated as {bucketId}_publication
    // Destination name is automatically generated as {bucketId}_destination

    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return toast.error('Source ID is required')
    if (!bucketId) return toast.error('Bucket ID is required')

    try {
      const publicationName = getAnalyticsBucketPublicationName(bucketId)
      await createPublication({
        projectRef,
        sourceId,
        name: publicationName,
        tables: values.tables.map((table) => {
          const [schema, name] = table.split('.')
          return { schema, name }
        }),
      })

      const keysToDecrypt = Object.entries(wrapperValues)
        .filter(([name]) =>
          ['vault_aws_access_key_id', 'vault_aws_secret_access_key'].includes(name)
        )
        .map(([_, keyId]) => keyId)
      const decryptedValues = await getDecryptedValues({
        projectRef,
        connectionString: project?.connectionString,
        ids: keysToDecrypt,
      })

      const warehouseName = bucketId
      const catalogToken = serviceKey?.api_key ?? ''
      const s3AccessKeyId = decryptedValues[wrapperValues['vault_aws_access_key_id']]
      const s3SecretAccessKey = decryptedValues[wrapperValues['vault_aws_secret_access_key']]
      const s3Region = projectSettings?.region ?? ''

      const protocol = projectSettings?.app_config?.protocol ?? 'https'
      const endpoint =
        projectSettings?.app_config?.storage_endpoint || projectSettings?.app_config?.endpoint
      const catalogUri = getCatalogURI(project?.ref ?? '', protocol, endpoint)
      const namespace = `${bucketId}_namespace`
      await createNamespace({
        catalogUri,
        warehouse: warehouseName,
        token: catalogToken,
        namespace,
      })

      const icebergConfiguration = {
        projectRef,
        warehouseName,
        namespace,
        catalogToken,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Region,
      }
      const destinationName = `${snakeCase(bucketId)}_destination`

      const { pipeline_id: pipelineId } = await createDestinationPipeline({
        projectRef,
        destinationName,
        destinationConfig: { iceberg: icebergConfiguration },
        sourceId,
        pipelineConfig: { publicationName },
      })

      // Pipeline can start behind the scenes, don't need to await
      startPipeline({ projectRef, pipelineId })
      toast.success(`Connected ${values.tables.length} tables to Analytics bucket!`)
      form.reset()
      setVisible(false)
    } catch (error: any) {
      // [Joshen] JFYI there's several async processes here so if something goes wrong midway - we need to figure out how to roll back cleanly
      // e.g publication gets created, but namespace creation fails -> should the old publication get deleted?
      // Another question is probably whether all of these step by step logic should be at the API level instead of client level
      // Same issue present within DestinationPanel - it's alright for now as we do an Alpha but this needs to be addressed before GA
      toast.error(`Failed to connect tables: ${error.message}`)
    }
  }

  const handleClose = () => {
    form.reset()
    setVisible(false)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          disabled={!isEnabled}
          size="tiny"
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => setVisible(true)}
          tooltip={{ content: { side: 'bottom', text: !isEnabled ? 'Coming soon' : undefined } }}
        >
          Connect tables
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect tables</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <p className="text-sm">
                Select the database tables to send data from. A destination analytics table will be
                created for each, and data will replicate automatically.
              </p>
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection className="overflow-visible">
              <FormField_Shadcn_
                control={form.control}
                name="tables"
                render={({ field }) => (
                  <FormItemLayout label="Tables">
                    <FormControl_Shadcn_>
                      <MultiSelector
                        values={field.value}
                        onValuesChange={field.onChange}
                        disabled={isConnecting}
                      >
                        <MultiSelector.Trigger label="Select tables..." badgeLimit="wrap" />
                        <MultiSelector.Content>
                          <MultiSelector.List>
                            {tables?.map((table) => (
                              <MultiSelector.Item
                                key={`${table.schema}.${table.name}`}
                                value={`${table.schema}.${table.name}`}
                              >
                                {`${table.schema}.${table.name}`}
                              </MultiSelector.Item>
                            ))}
                          </MultiSelector.List>
                        </MultiSelector.Content>
                      </MultiSelector>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isConnecting} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isConnecting} disabled={isConnecting}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
