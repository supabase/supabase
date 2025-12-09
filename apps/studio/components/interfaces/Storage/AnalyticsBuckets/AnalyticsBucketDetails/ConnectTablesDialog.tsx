import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useFlag, useParams } from 'common'
import { useApiKeysVisibility } from 'components/interfaces/APIKeys/hooks/useApiKeysVisibility'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useCreateTenantSourceMutation } from 'data/replication/create-tenant-source-mutation'
import { useCreatePublicationMutation } from 'data/replication/publication-create-mutation'
import { useUpdatePublicationMutation } from 'data/replication/publication-update-mutation'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useReplicationTablesQuery } from 'data/replication/tables-query'
import { getDecryptedValues } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import {
  getAnalyticsBucketPublicationName,
  getAnalyticsBucketsDestinationName,
} from './AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from './useAnalyticsBucketAssociatedEntities'
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

const formId = 'connect-tables-form'
const FormSchema = z.object({
  tables: z.array(z.string()).min(1, 'Select at least one table'),
})

type ConnectTablesForm = z.infer<typeof FormSchema>

enum PROGRESS_STAGE {
  CREATE_PUBLICATION = 'CREATE_PUBLICATION',
  CREATE_PIPELINE = 'CREATE_PIPELINE',
  START_PIPELINE = 'START_PIPELINE',
  UPDATE_PUBLICATION = 'CREATE_REPLICATION',
}

const PROGRESS_INDICATORS = {
  CREATE: [
    {
      step: PROGRESS_STAGE.CREATE_PUBLICATION,
      getDescription: (numTables: number) =>
        `Creating replication publication with ${numTables} table${numTables > 1 ? 's' : ''}...`,
    },
    { step: PROGRESS_STAGE.CREATE_PIPELINE, description: `Creating replication pipeline` },
    { step: PROGRESS_STAGE.START_PIPELINE, description: `Starting replication pipeline` },
  ],
  UPDATE: [
    {
      step: PROGRESS_STAGE.UPDATE_PUBLICATION,
      getDescription: (numTables: number) =>
        `Updating replication publication with ${numTables} table${numTables > 1 ? 's' : ''}...`,
    },
    { step: PROGRESS_STAGE.START_PIPELINE, description: 'Restarting replication pipeline...' },
  ],
}

interface ConnectTablesDialogProps {
  onSuccessConnectTables: () => void
}

export const ConnectTablesDialog = ({ onSuccessConnectTables }: ConnectTablesDialogProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const [visible, setVisible] = useState(false)

  const isEnabled = useFlag('storageAnalyticsVector') // Kill switch if we wanna hold off supporting connecting tables

  const { sourceId, pipeline, publication } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })
  const isEditingExistingPublication = !!publication && !!pipeline

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <ButtonTooltip
          disabled={!isEnabled}
          size="tiny"
          type="primary"
          icon={<Plus />}
          onClick={() => setVisible(true)}
          tooltip={{ content: { side: 'bottom', text: !isEnabled ? 'Coming soon' : undefined } }}
        >
          {isEditingExistingPublication ? 'Add tables' : 'Connect tables'}
        </ButtonTooltip>
      </DialogTrigger>

      {!sourceId ? (
        <EnableReplicationDialogContent onClose={() => setVisible(false)} />
      ) : (
        <ConnectTablesDialogContent
          visible={visible}
          onClose={() => setVisible(false)}
          onSuccessConnectTables={onSuccessConnectTables}
        />
      )}
    </Dialog>
  )
}

export const ConnectTablesDialogContent = ({
  visible,
  onClose,
  onSuccessConnectTables,
}: ConnectTablesDialogProps & { visible: boolean; onClose: () => void }) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingStep, setConnectingStep] = useState<PROGRESS_STAGE>()

  const form = useForm<ConnectTablesForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { tables: [] },
  })
  const { tables: selectedTables } = form.watch()

  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({ bucketId: bucketId })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })
  const { canReadAPIKeys } = useApiKeysVisibility()
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = getKeys(apiKeys)

  const { sourceId, pipeline, publication } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })
  const isEditingExistingPublication = !!publication && !!pipeline

  const { data: tables } = useReplicationTablesQuery({ projectRef, sourceId })

  const { mutateAsync: createPublication } = useCreatePublicationMutation()
  const { mutateAsync: updatePublication } = useUpdatePublicationMutation()
  const { mutateAsync: createDestinationPipeline } = useCreateDestinationPipelineMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  const progressIndicator = useMemo(
    () => (isEditingExistingPublication ? PROGRESS_INDICATORS.UPDATE : PROGRESS_INDICATORS.CREATE),
    // [Joshen] This is to prevent the progressIndicator from flipping to UPDATE in the middle of CREATE
    // since the publication and pipelines are getting created in the middle of CREATE
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnecting]
  )
  const totalProgressSteps = progressIndicator.length
  const currentStep = progressIndicator.findIndex((x) => x.step === connectingStep) + 1
  const progressDescription = progressIndicator.find((x) => x.step === connectingStep)

  const onSubmitNewPublication: SubmitHandler<ConnectTablesForm> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return toast.error('Bucket ID is required')
    if (!sourceId) return toast.error('Replication has not been enabled for your project')

    try {
      setIsConnecting(true)

      // Step 1: Create publication
      setConnectingStep(PROGRESS_STAGE.CREATE_PUBLICATION)
      const publicationName = getAnalyticsBucketPublicationName(bucketId)
      const publicationTables = values.tables.map((table) => {
        const [schema, name] = table.split('.')
        return { schema, name }
      })
      await createPublication({
        projectRef,
        sourceId,
        name: publicationName,
        tables: publicationTables,
      })

      // Step 2: Create destination pipeline
      setConnectingStep(PROGRESS_STAGE.CREATE_PIPELINE)
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
      const destinationName = getAnalyticsBucketsDestinationName(bucketId)
      const { pipeline_id: pipelineId } = await createDestinationPipeline({
        projectRef,
        destinationName,
        destinationConfig: { iceberg: icebergConfiguration },
        sourceId,
        pipelineConfig: { publicationName },
      })

      // Step 3: Start the destination pipeline
      setConnectingStep(PROGRESS_STAGE.START_PIPELINE)
      await startPipeline({ projectRef, pipelineId })

      onSuccessConnectTables?.()
      toast.success(`Connected ${values.tables.length} tables to Analytics bucket!`)
      form.reset()
      onClose()
    } catch (error: any) {
      // [Joshen] JFYI there's several async processes here so if something goes wrong midway - we need to figure out how to roll back cleanly
      // e.g publication gets created, but namespace creation fails -> should the old publication get deleted?
      // Another question is probably whether all of these step by step logic should be at the API level instead of client level
      // Same issue present within DestinationPanel - it's alright for now as we do an Alpha but this needs to be addressed before GA
      toast.error(`Failed to connect tables: ${error.message}`)
    } finally {
      setIsConnecting(false)
      setConnectingStep(undefined)
    }
  }

  const onSubmitUpdatePublication: SubmitHandler<ConnectTablesForm> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return toast.error('Replication has not been enabled on this project')
    if (!bucketId) return toast.error('Bucket ID is required')
    if (!publication) return toast.error('Unable to find existing publication')
    if (!pipeline) return toast.error('Unable to find existing pipeline')

    try {
      setIsConnecting(true)

      const tablesToBeAdded = values.tables.map((table) => {
        const [schema, name] = table.split('.')
        return { schema, name }
      })
      setConnectingStep(PROGRESS_STAGE.UPDATE_PUBLICATION)
      const publicationTables = publication.tables.concat(tablesToBeAdded)
      await updatePublication({
        projectRef,
        sourceId,
        publicationName: publication.name,
        tables: publicationTables,
      })

      setConnectingStep(PROGRESS_STAGE.START_PIPELINE)
      await startPipeline({ projectRef, pipelineId: pipeline.id })

      onSuccessConnectTables?.()
      toast.success('Successfully updated connected tables! Pipeline is being restarted')
      onClose()
    } catch (error: any) {
      toast.error(`Failed to update tables: ${error.message}`)
    } finally {
      setIsConnecting(false)
      setConnectingStep(undefined)
    }
  }

  const onSubmit: SubmitHandler<ConnectTablesForm> = async (values) => {
    if (isEditingExistingPublication) {
      onSubmitUpdatePublication(values)
    } else {
      onSubmitNewPublication(values)
    }
  }

  useEffect(() => {
    form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEditingExistingPublication ? 'Connect more tables' : 'Connect tables'}
        </DialogTitle>
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
                          {tables?.map((table) => {
                            const alreadyConnected = (publication?.tables ?? []).some(
                              (x) => x.schema === table.schema && x.name === table.name
                            )
                            return (
                              <MultiSelector.Item
                                disabled={alreadyConnected}
                                className="[&>div]:flex [&>div]:items-center [&>div]:justify-between"
                                key={`${table.schema}.${table.name}`}
                                value={`${table.schema}.${table.name}`}
                              >
                                <span>{`${table.schema}.${table.name}`}</span>
                                {alreadyConnected && <span>Connected to analytics bucket</span>}
                              </MultiSelector.Item>
                            )
                          })}
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
        {isConnecting && !!progressDescription && (
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
                  {'getDescription' in progressDescription
                    ? progressDescription.getDescription?.(selectedTables.length)
                    : progressDescription.description}
                </p>
                <Loader2 size={14} className="animate-spin" />
              </div>
              <Progress value={(currentStep / (totalProgressSteps + 1)) * 100} />
            </DialogSection>
          </motion.div>
        )}
      </AnimatePresence>

      <DialogFooter>
        <Button type="default" disabled={isConnecting} onClick={onClose}>
          Cancel
        </Button>
        <Button form={formId} htmlType="submit" disabled={isConnecting}>
          Connect
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

const EnableReplicationDialogContent = ({ onClose }: { onClose: () => void }) => {
  const { ref: projectRef } = useParams()
  const enablePgReplicate = useIsETLPrivateAlpha()
  const { error } = useReplicationSourcesQuery({ projectRef })
  const noAccessToReplication =
    !enablePgReplicate || error?.message.includes('feature flag is required')

  const { mutateAsync: createTenantSource, isPending: creatingTenantSource } =
    useCreateTenantSourceMutation()

  const onEnableReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    await createTenantSource({ projectRef })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Database replication needs to be enabled</DialogTitle>
        <DialogDescription>
          Replication is used to sync data from your Postgres tables
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="flex flex-col gap-y-2 !p-0">
        <Admonition
          type="warning"
          className="rounded-none border-0"
          title={
            noAccessToReplication
              ? 'Replication is currently unavailable for your project'
              : 'Replication is currently in Alpha'
          }
        >
          {noAccessToReplication ? (
            <p className="text-sm !leading-normal">
              Access to database replication is currently not available yet for public use. If
              you're interested, do reach out to us via support!
            </p>
          ) : (
            <>
              <p className="text-sm !leading-normal">
                This feature is in active development and may change as we gather feedback.
                Availability and behavior can evolve while in Alpha.
              </p>
              <p className="text-sm !leading-normal">
                Pricing has not been finalized yet. You can enable replication now; we’ll announce
                pricing later and notify you before any charges apply.
              </p>
            </>
          )}
        </Admonition>
      </DialogSection>
      <DialogFooter>
        <Button type="default" disabled={creatingTenantSource} onClick={() => onClose()}>
          {noAccessToReplication ? 'Understood' : 'Cancel'}
        </Button>
        {!noAccessToReplication && (
          <Button type="primary" loading={creatingTenantSource} onClick={onEnableReplication}>
            Enable replication
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}
