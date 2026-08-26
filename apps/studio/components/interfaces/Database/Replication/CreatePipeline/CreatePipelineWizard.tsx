import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFeatureFlags, useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  CardContent,
  cn,
  Form,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AdvancedSettings } from '../DestinationPanel/DestinationForm/AdvancedSettings'
import { getAnalyticsBucketValidationIssues } from '../DestinationPanel/DestinationForm/AnalyticsBucket/AnalyticsBucket.utils'
import { AnalyticsBucketFields } from '../DestinationPanel/DestinationForm/AnalyticsBucket/Fields'
import { getBigQueryValidationIssues } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { BigQueryFields } from '../DestinationPanel/DestinationForm/BigQuery/Fields'
import { getClickHouseValidationIssues } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.utils'
import { ClickHouseFields } from '../DestinationPanel/DestinationForm/ClickHouse/Fields'
import { DestinationPanelFormSchema as FormSchema } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import {
  areValidationFailuresEqual,
  buildTableSyncCopyConfig,
  generateDefaultValues,
  pruneStaleSelectedTableIds,
} from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { DestinationNameInput } from '../DestinationPanel/DestinationForm/DestinationNameInput'
import { getDucklakeValidationIssues } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.utils'
import { DuckLakeFields } from '../DestinationPanel/DestinationForm/DuckLake/Fields'
import { NewPublicationPanel } from '../DestinationPanel/DestinationForm/NewPublicationPanel'
import { NoDestinationsAvailable } from '../DestinationPanel/DestinationForm/NoDestinationsAvailable'
import { PipelineCostDialog } from '../DestinationPanel/DestinationForm/PipelineCostDialog'
import { PublicationSelection } from '../DestinationPanel/DestinationForm/PublicationSelection'
import { SnowflakeFields } from '../DestinationPanel/DestinationForm/Snowflake/Fields'
import { getSnowflakeValidationIssues } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.utils'
import { TableCopySelection } from '../DestinationPanel/DestinationForm/TableCopySelection'
import { useDestinationForm } from '../DestinationPanel/DestinationForm/useDestinationForm'
import { ValidationWarningsDialog } from '../DestinationPanel/DestinationForm/ValidationWarningsDialog'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { DestinationTypeSelection } from '../DestinationPanel/DestinationTypeSelection'
import { LocalReplicationUnavailableAdmonition } from '../LocalReplicationUnavailableAdmonition'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { useRedirectLegacyReadReplicaDestination } from '../useRedirectLegacyReadReplicaDestination'
import { CreatePipelineGate } from './CreatePipelineGate'
import {
  getPipelineCreateConnectionStepFieldNames,
  getPipelineCreateStepDocsUrl,
  getPipelineCreateStepHeader,
  isPipelineDestinationType,
  mergeFormValuesForDestinationTypeChange,
  PIPELINE_CREATE_DATA_STEP_FIELD_NAMES,
  PIPELINE_CREATE_STEPS,
  type PipelineCreateStepId,
  type PipelineDestinationType,
} from './CreatePipelineWizard.utils'
import { PipelineCreateStepDescription } from './PipelineCreateStepDescription'
import { PipelineRegionField } from './PipelineRegionField'
import { PipelineReviewSummary } from './PipelineReviewSummary'
import { PipelineValidationAdmonition } from './PipelineValidationAdmonition'
import { CreateAnalyticsBucketSheet } from '@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { useRegisterIsolatedStudioFlowClose } from '@/components/layouts/Navigation/LayoutHeader/IsolatedStudioFlowClose'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { SteppedFlow, SteppedFlowHeader } from '@/components/ui/SteppedFlow/SteppedFlow'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import {
  useReplicationSourceId,
  useReplicationSourcesQuery,
} from '@/data/replication/sources-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

const formId = 'create-pipeline'

export const CreatePipelineWizard = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const { configcat: flagStore } = useFeatureFlags()
  const isFlagStoreLoaded = Object.keys(flagStore).length > 0
  const enablePgReplicate = useIsETLPrivateAlpha()
  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [step, setStep] = useState<PipelineCreateStepId>('destination')
  const [showValidationWarningsDialog, setShowValidationWarningsDialog] = useState(false)
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const [newBucketSheetVisible, setNewBucketSheetVisible] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof FormSchema> | null>(
    null
  )
  const validationSectionRef = useRef<React.ComponentRef<typeof PipelineValidationAdmonition>>(null)

  useRedirectLegacyReadReplicaDestination()

  const [urlDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
      'ClickHouse',
    ]).withOptions({
      history: 'replace',
      clearOnDefault: true,
    })
  )

  const selectedType = isPipelineDestinationType(urlDestinationType) ? urlDestinationType : null
  const previousSelectedTypeRef = useRef<PipelineDestinationType | null>(null)

  const listHref = `/project/${projectRef}/database/replication`

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
  })
  const externalReplicationSource = sourcesData?.sources.find(
    (source) => source.name === projectRef
  )
  const replicationNotEnabled = isSourcesSuccess && !externalReplicationSource

  const { mutate: createTenantSource, isPending: isEnablingPipelines } =
    useCreateTenantSourceMutation({
      onSuccess: () => toast.success('Pipelines enabled'),
      onError: (error) => toast.error(`Failed to enable Pipelines: ${error.message}`),
    })

  const availableDestinations = useMemo(() => {
    const destinations: DestinationType[] = []
    if (etlEnableBigQuery) destinations.push('BigQuery')
    if (etlEnableIceberg) destinations.push('Analytics Bucket')
    if (etlEnableDucklake) destinations.push('DuckLake')
    if (etlEnableSnowflake) destinations.push('Snowflake')
    if (etlEnableClickHouse) destinations.push('ClickHouse')
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

  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys && selectedType === 'Analytics Bucket' }
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
  } = useDestinationForm({ selectedType: selectedType ?? 'BigQuery' })

  const defaultValues = useMemo(
    () =>
      generateDefaultValues({
        catalogToken,
        region: projectSettings?.region,
        projectRef,
        editMode: false,
      }),
    [catalogToken, projectSettings, projectRef]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(
      FormSchema.superRefine((data, ctx) => {
        const addRequiredFieldError = (path: string, message: string) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [path],
          })
        }

        if (!selectedType) return

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
          getBigQueryValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'Analytics Bucket') {
          getAnalyticsBucketValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'DuckLake') {
          getDucklakeValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'Snowflake') {
          getSnowflakeValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'ClickHouse') {
          getClickHouseValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        }
      })
    ),
    defaultValues,
  })

  const { isDirty } = form.formState
  const formValues = useWatch({ control: form.control }) ?? defaultValues
  const { publicationName, tableSyncCopyMode, tableSyncCopyTableIds } = formValues

  const publicationNames = useMemo(() => publications.map((pub) => pub.name), [publications])
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
      publications.find(({ name: pubName }) => pubName === pendingFormValues?.publicationName)
        ?.tables ?? [],
    [pendingFormValues?.publicationName, publications]
  )

  const goToList = () => {
    if (!projectRef) return
    router.push(listHref)
  }

  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty || step !== 'destination',
    onClose: goToList,
  })
  useRegisterIsolatedStudioFlowClose(confirmOnClose)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || step !== 'destination') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, step])

  const canContinueFromDestination = selectedType !== null

  const isSubmitDisabled =
    isSaving || !isSuccessPublications || isSelectedPublicationMissing || hasNoAvailableDestinations

  const getSubmitButtonText = () => {
    if (hasRunValidation && validationWarnings.length > 0 && !hasValidationFailures) {
      return 'Create and start pipeline anyway'
    }
    return 'Create and start pipeline'
  }

  const openCostDialog = (data: z.infer<typeof FormSchema>) => {
    setPendingFormValues(data)
    setShowCostDialog(true)
  }

  const onSubmit = async (rawData: z.infer<typeof FormSchema>) => {
    if (!isSuccessPublications) {
      toast.error('Publication tables are unavailable. Refresh and try again.')
      return
    }

    const data: z.infer<typeof FormSchema> = {
      ...rawData,
      tableSyncCopyTableIds: pruneStaleSelectedTableIds({
        mode: rawData.tableSyncCopyMode,
        selectedTableIds: rawData.tableSyncCopyTableIds,
        publications,
        publicationName: rawData.publicationName,
      }),
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
    if (!validationResult.canContinue) return

    const hasWarnings = validationResult.warnings.length > 0
    const warningsUnchanged =
      previousFailuresAreOnlyWarnings &&
      areValidationFailuresEqual(previousWarnings, validationResult.warnings)

    if (hasWarnings) {
      if (warningsUnchanged) {
        setPendingFormValues(data)
        setShowValidationWarningsDialog(true)
      }
      return
    }

    openCostDialog(data)
  }

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
      onSuccess: () => form.reset(defaultValues),
      onClose: goToList,
    })
  }

  const handleNext = async () => {
    if (step === 'destination') {
      if (canContinueFromDestination) setStep('connection')
      return
    }

    if (step === 'connection' && selectedType) {
      const valid = await form.trigger(getPipelineCreateConnectionStepFieldNames(selectedType))
      if (valid) setStep('data')
      return
    }

    if (step === 'data') {
      const valid = await form.trigger([...PIPELINE_CREATE_DATA_STEP_FIELD_NAMES])
      if (valid) setStep('review')
    }
  }

  const nextDisabled = step === 'destination' && !canContinueFromDestination

  useEffect(() => {
    if (!selectedType) {
      previousSelectedTypeRef.current = null
      return
    }

    const previousType = previousSelectedTypeRef.current
    previousSelectedTypeRef.current = selectedType

    if (previousType === null || previousType === selectedType) return

    form.reset(mergeFormValuesForDestinationTypeChange(form.getValues(), defaultValues))
    resetValidation()
  }, [defaultValues, form, resetValidation, selectedType])

  useEffect(() => {
    if (!isDirty) {
      form.reset(defaultValues)
      resetValidation()
    }
  }, [defaultValues, form, isDirty, resetValidation])

  useEffect(() => {
    if (projectRef && sourceId) refetchPublications()
  }, [projectRef, refetchPublications, sourceId])

  if (isOrgLoading || !isFlagStoreLoaded) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-6 py-8">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!enablePgReplicate) {
    return (
      <CreatePipelineGate
        title="Request Pipelines access"
        description="Pipelines is in public alpha and being rolled out gradually. Request access to join the waitlist."
      >
        <div className={cn('flex max-w-xl flex-col gap-y-4 rounded-md border p-6')}>
          <div className="flex flex-col gap-y-1">
            <h4>Request Pipelines access</h4>
            <p className="text-sm text-foreground-light">
              Pipelines is in <span className="text-foreground">public alpha</span> and being rolled
              out gradually. Request access below to join the waitlist.
            </p>
          </div>
          <div className="flex gap-x-2">
            <Button
              asChild
              variant="secondary"
              iconRight={<ArrowUpRight size={16} strokeWidth={1.5} />}
            >
              <Link target="_blank" rel="noreferrer" href="https://forms.supabase.com/pg_replicate">
                Request Pipelines access
              </Link>
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/replication#pipelines`} />
          </div>
        </div>
      </CreatePipelineGate>
    )
  }

  if (replicationNotEnabled) {
    return (
      <EnablePipelinesAlertDialog
        onEnable={() => {
          if (projectRef) createTenantSource({ projectRef })
        }}
        isEnabling={isEnablingPipelines}
        onCancel={goToList}
      />
    )
  }

  if (hasNoAvailableDestinations) {
    return (
      <CreatePipelineGate
        title="Create a pipeline"
        description="Connect this Postgres database to an analytical destination."
      >
        <NoDestinationsAvailable />
      </CreatePipelineGate>
    )
  }

  const stepHeader = getPipelineCreateStepHeader(step, {
    destinationType: selectedType ?? undefined,
  })
  const stepDocsUrl = getPipelineCreateStepDocsUrl(step, selectedType ?? undefined)
  const pipelineCreateDocsButton = stepDocsUrl ? <DocsButton href={stepDocsUrl} /> : undefined

  return (
    <>
      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <SteppedFlow
            steps={[...PIPELINE_CREATE_STEPS]}
            currentStep={step}
            onStepChange={(nextStep) => setStep(nextStep as PipelineCreateStepId)}
            nextDisabled={nextDisabled}
            onNext={handleNext}
            navigationDisabled={isSaving || isValidating}
            finalAction={{
              label: getSubmitButtonText(),
              form: formId,
              loading: isSaving || isValidating,
              disabled: isSubmitDisabled,
            }}
          >
            {step === 'destination' && (
              <>
                <SteppedFlowHeader
                  title={stepHeader.title}
                  description={<PipelineCreateStepDescription step={step} />}
                >
                  <LocalReplicationUnavailableAdmonition className="pt-2" />
                </SteppedFlowHeader>
                <CardContent>
                  <DestinationTypeSelection variant="radio" />
                </CardContent>
              </>
            )}

            {step === 'connection' && selectedType && (
              <>
                <SteppedFlowHeader
                  title={stepHeader.title}
                  description={
                    <PipelineCreateStepDescription step={step} destinationType={selectedType} />
                  }
                  actions={pipelineCreateDocsButton}
                />
                <CardContent className="space-y-6">
                  <DestinationNameInput form={form} />
                  <PipelineRegionField destinationType={selectedType} />
                </CardContent>
                <CardContent>
                  {selectedType === 'BigQuery' && etlEnableBigQuery && (
                    <BigQueryFields form={form} editMode={false} className="p-0" />
                  )}
                  {selectedType === 'Analytics Bucket' && etlEnableIceberg && (
                    <AnalyticsBucketFields
                      form={form}
                      editMode={false}
                      className="p-0"
                      onSelectNewBucket={() => setNewBucketSheetVisible(true)}
                    />
                  )}
                  {selectedType === 'DuckLake' && etlEnableDucklake && (
                    <DuckLakeFields form={form} editMode={false} className="p-0" />
                  )}
                  {selectedType === 'Snowflake' && etlEnableSnowflake && (
                    <SnowflakeFields form={form} editMode={false} className="p-0" />
                  )}
                  {selectedType === 'ClickHouse' && etlEnableClickHouse && (
                    <ClickHouseFields form={form} editMode={false} className="p-0" />
                  )}
                </CardContent>
                <CardContent>
                  <AdvancedSettings
                    type={selectedType}
                    form={form}
                    group="connection"
                    className="px-0"
                  />
                </CardContent>
                {hasRunValidation && !isValidating && (
                  <PipelineValidationAdmonition failures={destinationValidationFailures} />
                )}
              </>
            )}

            {step === 'data' && selectedType && (
              <>
                <SteppedFlowHeader
                  title={stepHeader.title}
                  description={<PipelineCreateStepDescription step={step} />}
                  actions={pipelineCreateDocsButton}
                />
                <CardContent>
                  <PublicationSelection
                    form={form}
                    onSelectNewPublication={() => setPublicationPanelVisible(true)}
                  />
                </CardContent>
                <CardContent>
                  <TableCopySelection form={form} editMode={false} />
                </CardContent>
                <CardContent>
                  <AdvancedSettings type={selectedType} form={form} group="data" className="px-0" />
                </CardContent>
                {hasRunValidation && !isValidating && (
                  <PipelineValidationAdmonition failures={pipelineValidationFailures} />
                )}
              </>
            )}

            {step === 'review' && selectedType && (
              <>
                <SteppedFlowHeader
                  title={stepHeader.title}
                  description={<PipelineCreateStepDescription step={step} />}
                />
                <PipelineReviewSummary
                  type={selectedType}
                  values={{ ...defaultValues, ...formValues }}
                  publications={publications}
                  connectionFailures={destinationValidationFailures}
                  dataFailures={pipelineValidationFailures}
                  editDisabled={isSaving || isValidating}
                  validationScrollRef={validationSectionRef}
                  onGoToStep={setStep}
                />
              </>
            )}
          </SteppedFlow>
        </form>
      </Form>

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

      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}

function EnablePipelinesAlertDialog({
  onEnable,
  isEnabling,
  onCancel,
}: {
  onEnable: () => void
  isEnabling: boolean
  onCancel: () => void
}) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Pipelines</AlertDialogTitle>
          <AlertDialogDescription>
            Pipelines replicates your database to external destinations. It is billed for configured
            pipeline hours and data processed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isEnabling} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onEnable} disabled={isEnabling}>
            Enable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
