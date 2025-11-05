import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { snakeCase } from 'lodash'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useCreatePublicationMutation } from 'data/replication/publication-create-mutation'
import { useDeletePublicationMutation } from 'data/replication/publication-delete-mutation'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
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
  Progress,
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
  tables: z.array(z.string()).min(1, 'Select at least one table'),
})

const formId = 'connect-tables-form'
const isEnabled = true // Kill switch if we wanna hold off supporting connecting tables

type ConnectTablesForm = z.infer<typeof FormSchema>

interface ConnectTablesDialogProps {
  bucketId?: string
  onSuccessConnectTables?: () => Promise<any>
}

export const ConnectTablesDialog = ({
  bucketId,
  onSuccessConnectTables,
}: ConnectTablesDialogProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [visible, setVisible] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingStep, setConnectingStep] = useState(0)

  const form = useForm<ConnectTablesForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { tables: [] },
  })
  const { tables: selectedTables } = form.watch()

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

  const { mutateAsync: createNamespace } = useIcebergNamespaceCreateMutation()
  const { mutateAsync: createPublication } = useCreatePublicationMutation()
  const { mutateAsync: createDestinationPipeline } = useCreateDestinationPipelineMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  // [Joshen] For debugging purposes to reset things
  const { mutateAsync: deletePublication, isLoading: isDeletingPublication } =
    useDeletePublicationMutation()

  const onSubmit: SubmitHandler<ConnectTablesForm> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return toast.error('Source ID is required')
    if (!bucketId) return toast.error('Bucket ID is required')

    try {
      setIsConnecting(true)
      setConnectingStep(1)

      // Step 1: Create publication
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
      setConnectingStep(2)

      // Step 2: Create destination pipeline
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

      const icebergConfiguration = {
        projectRef,
        warehouseName,
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
      setConnectingStep(3)

      // Step 3: Start the destination pipeline
      await startPipeline({ projectRef, pipelineId })
      await onSuccessConnectTables?.()
      toast.success(`Connected ${values.tables.length} tables to Analytics bucket!`)
      form.reset()
      setVisible(false)
    } catch (error: any) {
      // [Joshen] JFYI there's several async processes here so if something goes wrong midway - we need to figure out how to roll back cleanly
      // e.g publication gets created, but namespace creation fails -> should the old publication get deleted?
      // Another question is probably whether all of these step by step logic should be at the API level instead of client level
      // Same issue present within DestinationPanel - it's alright for now as we do an Alpha but this needs to be addressed before GA
      toast.error(`Failed to connect tables: ${error.message}`)
    } finally {
      setIsConnecting(false)
      setConnectingStep(0)
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
                        <MultiSelector.Trigger
                          deletableBadge
                          badgeLimit="wrap"
                          mode="inline-combobox"
                          label="Select tables..."
                        />
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

        <AnimatePresence mode="wait">
          {isConnecting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <DialogSectionSeparator />
              <DialogSection>
                <div className="flex items-center gap-x-2 mb-2">
                  <p className="text-sm text-foreground-light">
                    {connectingStep === 1
                      ? `Creating replication publication with ${selectedTables.length} table${selectedTables.length > 1 ? 's' : ''}...`
                      : connectingStep === 2
                        ? 'Creating destination pipeline...'
                        : 'Starting destination pipeline...'}
                  </p>
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <Progress value={(connectingStep / 3) * 100} />
              </DialogSection>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="!justify-between items-center">
          <p className="text-sm text-foreground-lighter">Debugging tools for Joshen</p>
          <div className="flex items-center gap-x-2">
            <Button
              type="default"
              loading={isDeletingPublication}
              onClick={async () => {
                if (!projectRef || !sourceId || !bucketId) return
                const publicationName = getAnalyticsBucketPublicationName(bucketId)
                await deletePublication(
                  {
                    projectRef,
                    sourceId,
                    publicationName,
                  },
                  {
                    onSuccess: () => toast(`Deleted ${publicationName}`),
                  }
                )
              }}
            >
              Delete publication
            </Button>
            <Button asChild type="default">
              <Link href={`/project/${projectRef}/database/replication`}>View pipeline</Link>
            </Button>
          </div>
        </DialogFooter>

        <DialogFooter>
          <Button type="default" disabled={isConnecting} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" disabled={isConnecting}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
