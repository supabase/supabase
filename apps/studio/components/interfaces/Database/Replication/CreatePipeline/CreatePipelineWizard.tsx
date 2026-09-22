import { zodResolver } from '@hookform/resolvers/zod'
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
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AdvancedSettings } from '../DestinationPanel/DestinationForm/AdvancedSettings'
import { BIGQUERY_SERVICE_ACCOUNT_JSON_MESSAGE } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { BigQueryFields } from '../DestinationPanel/DestinationForm/BigQuery/Fields'
import { ClickHouseFields } from '../DestinationPanel/DestinationForm/ClickHouse/Fields'
import {
  DestinationPanelFormSchema as FormSchema,
  type DestinationPanelSchemaType,
} from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import {
  areValidationFailuresEqual,
  buildTableSyncCopyConfigPreview,
  generateDefaultValues,
  pruneStaleSelectedTableIds,
} from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { DestinationNameInput } from '../DestinationPanel/DestinationForm/DestinationNameInput'
import { DuckLakeFields } from '../DestinationPanel/DestinationForm/DuckLake/Fields'
import { NewPublicationPanel } from '../DestinationPanel/DestinationForm/NewPublicationPanel'
import { NoDestinationsAvailable } from '../DestinationPanel/DestinationForm/NoDestinationsAvailable'
import { PipelineRegionField } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import { PublicationSelection } from '../DestinationPanel/DestinationForm/PublicationSelection'
import { SnowflakeFields } from '../DestinationPanel/DestinationForm/Snowflake/Fields'
import { TableCopySelection } from '../DestinationPanel/DestinationForm/TableCopySelection'
import { useDestinationForm } from '../DestinationPanel/DestinationForm/useDestinationForm'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { DestinationTypeSelection } from '../DestinationPanel/DestinationTypeSelection'
import { LocalReplicationUnavailableAdmonition } from '../LocalReplicationUnavailableAdmonition'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { useRedirectLegacyReadReplicaDestination } from '../useRedirectLegacyReadReplicaDestination'
import { CreatePipelineGate } from './CreatePipelineGate'
import {
  getAccessiblePipelineCreateStep,
  getCreatePipelineSubmitLabel,
  getPipelineCreateConnectionStepFieldNames,
  getPipelineCreateConnectionValidationIssues,
  getPipelineCreateStepDocsUrl,
  getPipelineCreateStepHeader,
  hasCreatePipelineUnsavedChanges,
  hasValidDataStep,
  isCreatePipelineNextDisabled,
  isCreatePipelineSubmitDisabled,
  isPipelineDestinationType,
  mergeFormValuesForDestinationTypeChange,
  PIPELINE_CREATE_DATA_STEP_FIELD_NAMES,
  PIPELINE_CREATE_STEPS,
  type PipelineCreateStepId,
  type PipelineDestinationType,
} from './CreatePipelineWizard.utils'
import { PipelineCreateStepDescription } from './PipelineCreateStepDescription'
import { PipelineReviewSummary } from './PipelineReviewSummary'
import {
  CONNECTION_VALIDATION_HINT,
  DATA_VALIDATION_HINT,
  PipelineValidationAdmonition,
  SANDWICHED_ADMONITION_CLASS,
} from './PipelineValidationAdmonition'
import { useRegisterIsolatedStudioFlowClose } from '@/components/layouts/Navigation/LayoutHeader/IsolatedStudioFlowClose'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { SteppedFlow, SteppedFlowHeader } from '@/components/ui/SteppedFlow/SteppedFlow'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { useReplicationPublicationNamesQuery } from '@/data/replication/publication-names-query'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import {
  useReplicationSourceId,
  useReplicationSourcesQuery,
} from '@/data/replication/sources-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { usePreventNavigationOnUnsavedChanges } from '@/hooks/ui/usePreventNavigationOnUnsavedChanges'
import { DOCS_URL } from '@/lib/constants'

const formId = 'create-pipeline'

const isSamePageNavigation = (url: string) =>
  new URL(url, window.location.origin).pathname === window.location.pathname

export const CreatePipelineWizard = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const { configcat: flagStore } = useFeatureFlags()
  const isFlagStoreLoaded = Object.keys(flagStore).length > 0
  const enablePgReplicate = useIsETLPrivateAlpha()
  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()

  const [step, setStep] = useQueryState(
    'step',
    parseAsStringEnum<PipelineCreateStepId>(PIPELINE_CREATE_STEPS.map(({ id }) => id))
      .withDefault('destination')
      .withOptions({
        history: 'push',
        clearOnDefault: true,
      })
  )
  const [validatedConnectionSignature, setValidatedConnectionSignature] = useState<string | null>(
    null
  )
  const [verifiedConnectionSignature, setVerifiedConnectionSignature] = useState<string | null>(
    null
  )
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const validationSectionRef = useRef<React.ComponentRef<typeof PipelineValidationAdmonition>>(null)

  useRedirectLegacyReadReplicaDestination()

  const [urlDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
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
    if (etlEnableDucklake) destinations.push('DuckLake')
    if (etlEnableSnowflake) destinations.push('Snowflake')
    if (etlEnableClickHouse) destinations.push('ClickHouse')
    return destinations
  }, [etlEnableBigQuery, etlEnableDucklake, etlEnableSnowflake, etlEnableClickHouse])
  const hasNoAvailableDestinations = availableDestinations.length === 0

  const sourceId = useReplicationSourceId({ projectRef })
  const {
    data: publicationNameRows = [],
    isSuccess: isSuccessPublications,
    refetch: refetchPublications,
  } = useReplicationPublicationNamesQuery({ projectRef, sourceId })
  const publicationNamesList = publicationNameRows.map((publication) => publication.name)

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const {
    isValidating,
    validateDestinationConfiguration,
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
        catalogToken: '',
        region: projectSettings?.region,
        projectRef,
        editMode: false,
      }),
    [projectSettings, projectRef]
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

        if (
          isSuccessPublications &&
          (data.tableSyncCopyMode === 'include_tables' ||
            data.tableSyncCopyMode === 'skip_tables') &&
          data.tableSyncCopyTableIds.length === 0
        ) {
          addRequiredFieldError('tableSyncCopyTableIds', 'Select at least one table.')
        }

        getPipelineCreateConnectionValidationIssues({
          type: selectedType,
          data,
          validateBigQueryJson: false,
        }).forEach(({ path, message }) => addRequiredFieldError(path, message))
      })
    ),
    defaultValues,
  })

  const { isDirty } = form.formState
  const formValues = useWatch({ control: form.control })
  const reviewValues = { ...defaultValues, ...formValues } as DestinationPanelSchemaType
  const { publicationName } = formValues
  const {
    data: selectedPublication,
    isPending: isPublicationPending,
    isSuccess: isSuccessPublication,
  } = useReplicationPublicationQuery({ projectRef, sourceId, publicationName })
  const connectionSignature = JSON.stringify([
    selectedType,
    ...(selectedType === null
      ? []
      : getPipelineCreateConnectionStepFieldNames(selectedType).map((field) => formValues[field])),
  ])
  const isConnectionVerified = verifiedConnectionSignature === connectionSignature

  const publicationNames = publicationNamesList
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)
  const hasValidData = hasValidDataStep({
    publicationName: publicationName ?? '',
    tableSyncCopyMode: reviewValues.tableSyncCopyMode,
    tableSyncCopyTableIds: reviewValues.tableSyncCopyTableIds,
    publicationNames,
    publication: selectedPublication,
  })

  const allValidationFailures = [...destinationValidationFailures, ...pipelineValidationFailures]
  const hasValidationFailures = allValidationFailures.some((f) => f.failure_type === 'critical')
  const validationWarnings = allValidationFailures.filter((f) => f.failure_type === 'warning')

  const tableSyncCopy = useMemo(
    () =>
      buildTableSyncCopyConfigPreview({
        mode: reviewValues.tableSyncCopyMode,
        selectedTableIds: reviewValues.tableSyncCopyTableIds,
      }),
    [reviewValues.tableSyncCopyMode, reviewValues.tableSyncCopyTableIds]
  )
  const {
    data: costEstimate,
    isLoading: isCostEstimateLoading,
    isError: isCostEstimateError,
  } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: step === 'review' }
  )

  const goToList = () => {
    if (!projectRef) return
    router.push(listHref)
  }

  const hasUnsavedChanges = hasCreatePipelineUnsavedChanges({ isDirty, step })

  const {
    handleCancelNavigation,
    handleConfirmNavigation,
    bypassNavigationGuard,
    shouldConfirmNavigation,
  } = usePreventNavigationOnUnsavedChanges({
    hasChanges: hasUnsavedChanges,
    shouldBypassNavigation: isSamePageNavigation,
  })

  const leaveWizard = () => {
    bypassNavigationGuard()
    goToList()
  }

  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => hasUnsavedChanges,
    onClose: leaveWizard,
  })
  useRegisterIsolatedStudioFlowClose(confirmOnClose)

  const discardChangesDialog = (
    <DiscardChangesConfirmationDialog
      visible={modalProps.visible || shouldConfirmNavigation}
      onCancel={() => {
        modalProps.onCancel()
        handleCancelNavigation()
      }}
      onClose={() => {
        if (shouldConfirmNavigation) {
          handleConfirmNavigation()
          return
        }
        modalProps.onClose()
      }}
    />
  )

  const canContinueFromDestination = selectedType !== null

  const isSubmitDisabled = isCreatePipelineSubmitDisabled({
    isSaving,
    isSuccessPublications,
    isSelectedPublicationMissing,
    hasNoAvailableDestinations,
    isConnectionVerified,
    hasValidData,
  })

  const accessibleStep = getAccessiblePipelineCreateStep({
    requestedStep: step,
    hasDestination: selectedType !== null,
    isConnectionVerified,
    hasValidData,
  })

  const submitLabel = getCreatePipelineSubmitLabel({
    hasRunValidation,
    hasCriticalFailures: hasValidationFailures,
    warningCount: validationWarnings.length,
  })
  const submitVariant =
    hasRunValidation && validationWarnings.length > 0 && !hasValidationFailures
      ? 'warning'
      : 'primary'

  const onSubmit = async (rawData: z.infer<typeof FormSchema>) => {
    if (!isSuccessPublications || !isSuccessPublication || !selectedPublication) {
      toast.error('Publication tables are unavailable. Refresh and try again.')
      return
    }

    const data: z.infer<typeof FormSchema> = {
      ...rawData,
      tableSyncCopyTableIds: pruneStaleSelectedTableIds({
        mode: rawData.tableSyncCopyMode,
        selectedTableIds: rawData.tableSyncCopyTableIds,
        publication: selectedPublication,
        publicationName: rawData.publicationName,
      }),
    }

    if (selectedType === 'BigQuery') {
      const jsonIssue = getPipelineCreateConnectionValidationIssues({
        type: selectedType,
        data,
      }).find((issue) => issue.message === BIGQUERY_SERVICE_ACCOUNT_JSON_MESSAGE)
      if (jsonIssue) {
        form.setError(jsonIssue.path, { message: jsonIssue.message })
        setStep('connection')
        return
      }
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
      setVerifiedConnectionSignature(null)
      return
    }

    const hasWarnings = validationResult.warnings.length > 0
    const warningsUnchanged =
      previousFailuresAreOnlyWarnings &&
      areValidationFailuresEqual(previousWarnings, validationResult.warnings)

    if (hasWarnings) {
      if (!warningsUnchanged) return
    }

    await submitPipeline({
      data,
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
      if (isConnectionVerified) {
        setStep('data')
        return
      }

      const valid = await form.trigger(getPipelineCreateConnectionStepFieldNames(selectedType))
      const connectionIssues = getPipelineCreateConnectionValidationIssues({
        type: selectedType,
        data: form.getValues(),
        validateBigQueryJson: false,
      })
      connectionIssues.forEach(({ path, message }) => form.setError(path, { message }))
      if (!valid || connectionIssues.length > 0) return

      if (selectedType === 'BigQuery') {
        const jsonIssue = getPipelineCreateConnectionValidationIssues({
          type: selectedType,
          data: form.getValues(),
        }).find((issue) => issue.message === BIGQUERY_SERVICE_ACCOUNT_JSON_MESSAGE)
        if (jsonIssue) {
          form.setError(jsonIssue.path, { message: jsonIssue.message })
          return
        }
      }

      const validationResult = await validateDestinationConfiguration({
        data: form.getValues(),
        onValidationFail: () => {
          setTimeout(() => {
            validationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        },
      })
      setValidatedConnectionSignature(connectionSignature)
      if (!validationResult.canContinue) {
        setVerifiedConnectionSignature(null)
        return
      }

      setVerifiedConnectionSignature(connectionSignature)
      return
    }

    if (step === 'data') {
      const valid = await form.trigger([...PIPELINE_CREATE_DATA_STEP_FIELD_NAMES])
      if (valid && hasValidData) setStep('review')
    }
  }

  const nextDisabled = isCreatePipelineNextDisabled({
    step,
    hasDestination: canContinueFromDestination,
    hasPublicationName: !!publicationName,
    isPublicationReady: isSuccessPublication,
    isSelectedPublicationMissing,
  })

  useEffect(() => {
    if (step !== accessibleStep) setStep(accessibleStep)
  }, [accessibleStep, setStep, step])

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
      <>
        <div className="mx-auto w-full max-w-[760px] px-6 py-8">
          <GenericSkeletonLoader />
        </div>
        {discardChangesDialog}
      </>
    )
  }

  if (!enablePgReplicate) {
    return (
      <>
        <CreatePipelineGate
          title="Request Pipelines access"
          description="Pipelines is in public alpha and being rolled out gradually. Request access to join the waitlist."
        >
          <div className={cn('flex max-w-xl flex-col gap-y-4 rounded-md border p-6')}>
            <div className="flex flex-col gap-y-1">
              <h4>Request Pipelines access</h4>
              <p className="text-sm text-foreground-light">
                Pipelines is in <span className="text-foreground">public alpha</span> and being
                rolled out gradually. Request access below to join the waitlist.
              </p>
            </div>
            <div className="flex gap-x-2">
              <Button
                asChild
                variant="secondary"
                iconRight={<ArrowUpRight size={16} strokeWidth={1.5} />}
              >
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href="https://forms.supabase.com/pg_replicate"
                >
                  Request Pipelines access
                </Link>
              </Button>
              <DocsButton href={`${DOCS_URL}/guides/database/replication#pipelines`} />
            </div>
          </div>
        </CreatePipelineGate>
        {discardChangesDialog}
      </>
    )
  }

  if (replicationNotEnabled) {
    return (
      <>
        <EnablePipelinesAlertDialog
          onEnable={() => {
            if (projectRef) createTenantSource({ projectRef })
          }}
          isEnabling={isEnablingPipelines}
          onCancel={goToList}
        />
        {discardChangesDialog}
      </>
    )
  }

  if (hasNoAvailableDestinations) {
    return (
      <>
        <CreatePipelineGate
          title="Create a pipeline"
          description="Connect this Postgres database to an analytical destination."
        >
          <NoDestinationsAvailable />
        </CreatePipelineGate>
        {discardChangesDialog}
      </>
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
            nextLabel={
              step === 'connection' && !isConnectionVerified ? 'Test connection' : 'Continue'
            }
            nextLoading={
              (step === 'connection' && isValidating) ||
              (step === 'data' && !!publicationName && isPublicationPending)
            }
            onNext={handleNext}
            onCancel={confirmOnClose}
            navigationDisabled={isSaving || isValidating}
            finalAction={{
              label: submitLabel,
              form: formId,
              loading: isSaving || isValidating,
              disabled: isSubmitDisabled || isCostEstimateLoading,
              variant: submitVariant,
            }}
          >
            {step === 'destination' && (
              <>
                <SteppedFlowHeader
                  title={stepHeader.title}
                  description={<PipelineCreateStepDescription step={step} />}
                >
                  <LocalReplicationUnavailableAdmonition className="mt-2" />
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
                  <DestinationNameInput form={form} destinationType={selectedType} />
                  <PipelineRegionField destinationType={selectedType} />
                </CardContent>
                <CardContent>
                  {selectedType === 'BigQuery' && etlEnableBigQuery && (
                    <BigQueryFields form={form} editMode={false} className="p-0" />
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
                <AdvancedSettings type={selectedType} form={form} group="connection" flush />
                {hasRunValidation &&
                  validatedConnectionSignature === connectionSignature &&
                  !isValidating && (
                    <PipelineValidationAdmonition
                      ref={validationSectionRef}
                      failures={destinationValidationFailures}
                      hint={CONNECTION_VALIDATION_HINT}
                    />
                  )}
                {isConnectionVerified && (
                  <Admonition
                    type="success"
                    title="Ready to continue"
                    className={SANDWICHED_ADMONITION_CLASS}
                  >
                    Supabase can connect to this destination.
                  </Admonition>
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
                <AdvancedSettings type={selectedType} form={form} group="data" flush />
                {hasRunValidation && !isValidating && (
                  <PipelineValidationAdmonition
                    failures={pipelineValidationFailures}
                    hint={DATA_VALIDATION_HINT}
                  />
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
                  values={reviewValues}
                  publication={selectedPublication}
                  connectionFailures={destinationValidationFailures}
                  dataFailures={pipelineValidationFailures}
                  editDisabled={isSaving || isValidating}
                  validationScrollRef={validationSectionRef}
                  costEstimate={costEstimate}
                  isCostEstimateLoading={isCostEstimateLoading}
                  isCostEstimateError={isCostEstimateError}
                  tableSyncCopy={tableSyncCopy}
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

      {discardChangesDialog}
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
