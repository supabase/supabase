import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AWS_REGIONS } from 'shared-data'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Form,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetFooter,
  SheetSection,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../../useIsETLPrivateAlpha'
import { type DestinationType, type ExistingDestination } from '../DestinationPanel.types'
import { AdvancedSettings } from './AdvancedSettings'
import { getAnalyticsBucketValidationIssues } from './AnalyticsBucket/AnalyticsBucket.utils'
import { AnalyticsBucketFields } from './AnalyticsBucket/Fields'
import { getBigQueryValidationIssues } from './BigQuery/BigQuery.utils'
import { BigQueryFields } from './BigQuery/Fields'
import { getClickHouseValidationIssues } from './ClickHouse/ClickHouse.utils'
import { ClickHouseFields } from './ClickHouse/Fields'
import { DestinationPanelFormSchema as FormSchema } from './DestinationForm.schema'
import {
  areValidationFailuresEqual,
  buildTableSyncCopyConfig,
  generateDefaultValues,
  pruneStaleSelectedTableIds,
} from './DestinationForm.utils'
import { DestinationNameInput } from './DestinationNameInput'
import { getDucklakeValidationIssues } from './DuckLake/DuckLake.utils'
import { DuckLakeFields } from './DuckLake/Fields'
import { NewPublicationPanel } from './NewPublicationPanel'
import { NoDestinationsAvailable } from './NoDestinationsAvailable'
import { PipelineCostDialog } from './PipelineCostDialog'
import { PublicationSelection } from './PublicationSelection'
import { SnowflakeFields } from './Snowflake/Fields'
import { getSnowflakeValidationIssues } from './Snowflake/Snowflake.utils'
import { TableCopySelection } from './TableCopySelection'
import { useDestinationForm } from './useDestinationForm'
import { ValidationFailuresSection } from './ValidationFailuresSection'
import { ValidationWarningsDialog } from './ValidationWarningsDialog'
import { CreateAnalyticsBucketSheet } from '@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH, IS_STAGING_OR_LOCAL } from '@/lib/constants'

const formId = 'destination-editor'

// Pipelines always run out of a single fixed region per environment, regardless of the source
// project's region.
const PIPELINE_REGION = IS_STAGING_OR_LOCAL ? AWS_REGIONS.SOUTHEAST_ASIA : AWS_REGIONS.CENTRAL_EU

interface DestinationFormProps {
  selectedType: DestinationType
  visible: boolean
  existingDestination?: ExistingDestination
  onClose: () => void
}

export const DestinationForm = ({
  selectedType,
  visible,
  existingDestination,
  onClose,
}: DestinationFormProps) => {
  const { ref: projectRef } = useParams()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [showValidationWarningsDialog, setShowValidationWarningsDialog] = useState(false)
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const [newBucketSheetVisible, setNewBucketSheetVisible] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof FormSchema> | null>(
    null
  )

  const validationSectionRef = useRef<HTMLDivElement>(null)

  const editMode = !!existingDestination

  // Compute available destinations based on feature flags
  const availableDestinations = useMemo(() => {
    const destinations = []
    if (etlEnableBigQuery) destinations.push({ value: 'BigQuery', label: 'BigQuery' })
    if (etlEnableIceberg)
      destinations.push({ value: 'Analytics Bucket', label: 'Analytics Bucket' })
    if (etlEnableDucklake) destinations.push({ value: 'DuckLake', label: 'DuckLake' })
    if (etlEnableSnowflake) destinations.push({ value: 'Snowflake', label: 'Snowflake' })
    if (etlEnableClickHouse) destinations.push({ value: 'ClickHouse', label: 'ClickHouse' })
    return destinations
  }, [
    etlEnableBigQuery,
    etlEnableDucklake,
    etlEnableIceberg,
    etlEnableSnowflake,
    etlEnableClickHouse,
  ])
  const hasNoAvailableDestinations = availableDestinations.length === 0

  const sourceId = useReplicationSourceId({ projectRef })

  const {
    data: publications = [],
    isSuccess: isSuccessPublications,
    refetch: refetchPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const {
    data: destinationData,
    isError: isErrorDestination,
    isSuccess: isSuccessDestination,
  } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: existingDestination?.destinationId,
  })

  const {
    data: pipelineData,
    isError: isErrorPipeline,
    isSuccess: isSuccessPipeline,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId: existingDestination?.pipelineId,
  })
  const isErrorExistingConfig = editMode && (isErrorDestination || isErrorPipeline)
  const isExistingConfigReady = !editMode || (isSuccessDestination && isSuccessPipeline)

  // Revealed API keys are only ever consumed as the default catalog token for
  // Analytics Bucket (Iceberg) destinations, so don't fetch them for other
  // destination types.
  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys && selectedType === 'Analytics Bucket' && !editMode }
  )
  const { serviceKey } = apiKeysData ?? {}
  const catalogToken = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const {
    isValidating,
    validateConfiguration,
    isSaving,
    submitPipeline,
    hasRunValidation,
    destinationValidationFailures,
    pipelineValidationFailures,
    resetValidation,
  } = useDestinationForm({ selectedType })

  const defaultValues = useMemo(
    () =>
      generateDefaultValues({
        destinationData,
        pipelineData,
        catalogToken,
        region: projectSettings?.region,
        projectRef,
        editMode,
      }),
    [destinationData, pipelineData, catalogToken, projectSettings, projectRef, editMode]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(
      FormSchema.superRefine((data, ctx) => {
        const addRequiredFieldError = (path: string, message: string) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [path],
          })
        }

        const selectedPublicationTableIds = pruneStaleSelectedTableIds({
          mode: data.tableSyncCopyMode,
          selectedTableIds: data.tableSyncCopyTableIds,
          publications,
          publicationName: data.publicationName,
        })

        if (
          isSuccessPublications &&
          (data.tableSyncCopyMode === 'include_tables' ||
            data.tableSyncCopyMode === 'skip_tables') &&
          selectedPublicationTableIds.length === 0
        ) {
          addRequiredFieldError('tableSyncCopyTableIds', 'Select at least one table')
        }

        if (selectedType === 'BigQuery') {
          getBigQueryValidationIssues(data, { secretsOptional: editMode }).forEach(
            ({ path, message }) => {
              addRequiredFieldError(path, message)
            }
          )
        } else if (selectedType === 'Analytics Bucket') {
          getAnalyticsBucketValidationIssues(data, {
            secretsOptional: editMode,
            storedS3AccessKeyId: editMode ? defaultValues.s3AccessKeyId : undefined,
          }).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'DuckLake') {
          getDucklakeValidationIssues(data, { secretsOptional: editMode }).forEach(
            ({ path, message }) => {
              addRequiredFieldError(path, message)
            }
          )
        } else if (selectedType === 'Snowflake') {
          getSnowflakeValidationIssues(data, { secretsOptional: editMode }).forEach(
            ({ path, message }) => {
              addRequiredFieldError(path, message)
            }
          )
        } else if (selectedType === 'ClickHouse') {
          getClickHouseValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        }
      })
    ),
    defaultValues,
  })

  const { publicationName } = form.watch()

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  const allValidationFailures = [...destinationValidationFailures, ...pipelineValidationFailures]
  const hasValidationFailures = allValidationFailures.some((f) => f.failure_type === 'critical')
  const validationWarnings = allValidationFailures.filter((f) => f.failure_type === 'warning')

  const pendingTableSyncCopy = useMemo(
    () =>
      pendingFormValues === null
        ? undefined
        : buildTableSyncCopyConfig({
            mode: pendingFormValues.tableSyncCopyMode,
            selectedTableIds: pendingFormValues.tableSyncCopyTableIds,
          }),
    [pendingFormValues]
  )
  const pendingPublicationTables = useMemo(
    () =>
      publications.find(({ name }) => name === pendingFormValues?.publicationName)?.tables ?? [],
    [pendingFormValues?.publicationName, publications]
  )

  const isSubmitDisabled =
    isSaving ||
    !isExistingConfigReady ||
    !isSuccessPublications ||
    isSelectedPublicationMissing ||
    (!editMode && hasNoAvailableDestinations)

  const getSubmitButtonText = () => {
    if (editMode) {
      return existingDestination?.enabled
        ? 'Apply and restart pipeline'
        : 'Apply and start pipeline'
    } else {
      if (hasRunValidation && validationWarnings.length > 0 && !hasValidationFailures) {
        return 'Create and start pipeline anyway'
      }

      return 'Create and start pipeline'
    }
  }

  // Stages the form values and opens the cost-estimation dialog, which is the final gate before
  // a pipeline is created and started.
  const openCostDialog = (data: z.infer<typeof FormSchema>) => {
    setPendingFormValues(data)
    setShowCostDialog(true)
  }

  const onSubmit = async (rawData: z.infer<typeof FormSchema>) => {
    if (!isSuccessPublications) {
      toast.error('Publication tables are unavailable. Refresh and try again.')
      return
    }

    // Drop any previously selected id that has since fallen out of the
    // publication before validating a create or submitting an edit.
    const data: z.infer<typeof FormSchema> = {
      ...rawData,
      tableSyncCopyTableIds: pruneStaleSelectedTableIds({
        mode: rawData.tableSyncCopyMode,
        selectedTableIds: rawData.tableSyncCopyTableIds,
        publications,
        publicationName: rawData.publicationName,
      }),
    }

    // Pipeline prerequisite validation models a new pipeline and cannot
    // account for resources already owned by an existing pipeline. Edits keep
    // the established direct-update flow after pruning stale table ids.
    if (editMode) {
      await submitPipeline({
        data,
        existingDestination,
        existingBatch: pipelineData?.config.batch,
        onSuccess: () => form.reset(defaultValues),
        onClose,
      })
      return
    }

    const previousValidationFailures = allValidationFailures
    const previousWarnings = previousValidationFailures.filter((f) => f.failure_type === 'warning')
    const previousFailuresAreOnlyWarnings =
      hasRunValidation &&
      previousValidationFailures.length > 0 &&
      previousValidationFailures.every((f) => f.failure_type === 'warning')

    const validationResult = await validateConfiguration({
      data,
      onValidationFail: () => {
        setTimeout(() => {
          validationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      },
    })
    if (!validationResult.canContinue) {
      // Critical failures shown inline — stop so user can fix them
      return
    }

    const hasWarnings = validationResult.warnings.length > 0
    const warningsUnchanged =
      previousFailuresAreOnlyWarnings &&
      areValidationFailuresEqual(previousWarnings, validationResult.warnings)

    // Open the warnings confirmation when there are warnings (and they're unchanged on resubmit),
    // otherwise go straight to the cost dialog. New/changed warnings are shown inline so the user
    // can review and submit again.
    if (hasWarnings) {
      if (warningsUnchanged) {
        setPendingFormValues(data)
        setShowValidationWarningsDialog(true)
      }
      return
    }

    openCostDialog(data)
  }

  // Confirming create warnings advances to the cost dialog.
  const handleValidationWarningsConfirm = () => {
    if (!pendingFormValues) return
    setShowValidationWarningsDialog(false)
    openCostDialog(pendingFormValues)
  }

  const handleCostConfirm = async () => {
    if (!pendingFormValues) return

    const values = pendingFormValues
    setShowCostDialog(false)

    await submitPipeline({
      data: values,
      existingDestination,
      existingBatch: pipelineData?.config.batch,
      onSuccess: () => form.reset(defaultValues),
      onClose,
    })
  }

  useEffect(() => {
    if (visible && !form.formState.isDirty) {
      form.reset(defaultValues)
      resetValidation()
    }
  }, [visible, defaultValues, form, resetValidation])

  useEffect(() => {
    if (visible && projectRef && sourceId) {
      refetchPublications()
    }
  }, [visible, projectRef, sourceId, refetchPublications])

  return (
    <>
      <SheetSection className="grow overflow-auto px-0 py-0">
        {hasNoAvailableDestinations && !editMode ? (
          <NoDestinationsAvailable />
        ) : (
          <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              <fieldset disabled={!isExistingConfigReady} className="contents">
                <div className="p-5 flex flex-col gap-y-6">
                  {isErrorExistingConfig && (
                    <Admonition type="warning">
                      <p className="leading-normal!">
                        The existing destination or pipeline settings could not be loaded. Refresh
                        before applying changes.
                      </p>
                    </Admonition>
                  )}
                  <p className="text-sm font-medium text-foreground">Destination details</p>

                  <div className="flex flex-col gap-y-4">
                    <DestinationNameInput form={form} />
                    <PublicationSelection
                      form={form}
                      onSelectNewPublication={() => setPublicationPanelVisible(true)}
                    />
                    <TableCopySelection form={form} editMode={editMode} />
                    <FormItemLayout
                      isReactForm={false}
                      layout="horizontal"
                      label="Region"
                      description={
                        <span className="text-foreground-lighter">
                          Pipelines run in{' '}
                          <Tooltip>
                            <TooltipTrigger className={InlineLinkClassName}>
                              {PIPELINE_REGION.displayName}
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{PIPELINE_REGION.code}</TooltipContent>
                          </Tooltip>
                          . In your destination provider, choose the closest available region.
                        </span>
                      }
                    >
                      <Select disabled value={PIPELINE_REGION.code}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PIPELINE_REGION.code}>
                            <div className="flex gap-x-3 items-center">
                              <img
                                alt="region icon"
                                className="w-5 rounded-xs"
                                src={`${BASE_PATH}/img/regions/${PIPELINE_REGION.code}.svg`}
                              />
                              <p className="flex items-center gap-x-2">
                                <span>{PIPELINE_REGION.displayName}</span>
                                <span className="text-xs text-foreground-lighter font-mono">
                                  {PIPELINE_REGION.code}
                                </span>
                              </p>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  </div>
                </div>

                <DialogSectionSeparator />

                {selectedType === 'BigQuery' && etlEnableBigQuery ? (
                  <BigQueryFields form={form} editMode={editMode} />
                ) : selectedType === 'Analytics Bucket' && etlEnableIceberg ? (
                  <AnalyticsBucketFields
                    form={form}
                    editMode={editMode}
                    onSelectNewBucket={() => setNewBucketSheetVisible(true)}
                  />
                ) : selectedType === 'DuckLake' && etlEnableDucklake ? (
                  <DuckLakeFields form={form} editMode={editMode} />
                ) : selectedType === 'Snowflake' && etlEnableSnowflake ? (
                  <SnowflakeFields
                    form={form}
                    editMode={editMode}
                    hasStoredPrivateKeyPassphrase={
                      editMode && !!defaultValues.snowflakePrivateKeyPassphrase
                    }
                  />
                ) : selectedType === 'ClickHouse' && etlEnableClickHouse ? (
                  <ClickHouseFields
                    form={form}
                    hasStoredPassword={editMode && !!defaultValues.clickhousePassword}
                  />
                ) : null}

                <DialogSectionSeparator />

                <AdvancedSettings type={selectedType} form={form} />

                {!editMode && hasRunValidation && !isValidating && (
                  <>
                    <DialogSectionSeparator />

                    <div ref={validationSectionRef}>
                      <ValidationFailuresSection
                        destinationFailures={destinationValidationFailures}
                        pipelineFailures={pipelineValidationFailures}
                      />
                    </div>
                  </>
                )}
              </fieldset>
            </form>
          </Form>
        )}
      </SheetSection>

      <SheetFooter className="justify-between!">
        <AnimatePresence mode="wait">
          {isValidating || isSaving ? (
            <motion.div
              className="flex items-center gap-x-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Loader2 className="animate-spin" size={14} />
              <p className="text-foreground-light text-sm">
                {isValidating
                  ? 'Validating destination configuration...'
                  : editMode
                    ? existingDestination?.enabled
                      ? 'Updating destination and restarting pipeline...'
                      : 'Updating destination and starting pipeline...'
                    : 'Creating pipeline...'}
              </p>
            </motion.div>
          ) : (
            <div />
          )}
        </AnimatePresence>
        <div className="flex items-center gap-x-2">
          <Button disabled={isSaving} variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitDisabled} loading={isSaving} form={formId} type="submit">
            {getSubmitButtonText()}
          </Button>
        </div>
      </SheetFooter>

      <NewPublicationPanel
        visible={publicationPanelVisible}
        onClose={(newPublication?: string) => {
          if (newPublication) {
            form.setValue('tableSyncCopyTableIds', [], {
              shouldDirty: true,
              shouldValidate: true,
            })
            form.setValue('publicationName', newPublication, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          setPublicationPanelVisible(false)
        }}
      />

      <CreateAnalyticsBucketSheet
        open={newBucketSheetVisible}
        onOpenChange={setNewBucketSheetVisible}
      />

      <ValidationWarningsDialog
        open={showValidationWarningsDialog}
        onOpenChange={setShowValidationWarningsDialog}
        isLoading={isSaving}
        warningCount={validationWarnings.length}
        onConfirm={handleValidationWarningsConfirm}
      />

      <PipelineCostDialog
        open={showCostDialog}
        isConfirming={isSaving}
        publicationName={pendingFormValues?.publicationName}
        publicationTables={pendingPublicationTables}
        tableSyncCopy={pendingTableSyncCopy}
        onOpenChange={setShowCostDialog}
        onConfirm={handleCostConfirm}
      />
    </>
  )
}
