import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, cn, Form } from 'ui'
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
import { ValidationFailuresSection } from '../DestinationPanel/DestinationForm/ValidationFailuresSection'
import { ValidationWarningsDialog } from '../DestinationPanel/DestinationForm/ValidationWarningsDialog'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { DestinationTypeSelection } from '../DestinationPanel/DestinationTypeSelection'
import { EnablePipelinesCallout } from '../EnablePipelinesCallout'
import { LocalReplicationUnavailableAdmonition } from '../LocalReplicationUnavailableAdmonition'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { CreatePipelineGate } from './CreatePipelineGate'
import {
  hasValidConnection,
  hasValidDataStep,
  isPipelineDestinationType,
  PIPELINE_CREATE_STEPS,
  type PipelineCreateStepId,
} from './CreatePipelineWizard.utils'
import { PipelineRegionField } from './PipelineRegionField'
import { CreateAnalyticsBucketSheet } from '@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { useRegisterIsolatedStudioFlowClose } from '@/components/layouts/Navigation/LayoutHeader/IsolatedStudioFlowClose'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { SteppedFlow } from '@/components/ui/SteppedFlow/SteppedFlow'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import {
  useReplicationSourceId,
  useReplicationSourcesQuery,
} from '@/data/replication/sources-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

const formId = 'create-pipeline'

export const CreatePipelineWizard = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
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
  const validationSectionRef = useRef<HTMLDivElement>(null)

  const [urlDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
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

  const listHref = `/project/${projectRef}/database/replication`

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
  })
  const externalReplicationSource = sourcesData?.sources.find(
    (source) => source.name === projectRef
  )
  const replicationNotEnabled = isSourcesSuccess && !externalReplicationSource

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
  const { name, publicationName, tableSyncCopyMode, tableSyncCopyTableIds } = formValues

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

  const canContinueFromDestination = selectedType !== null
  const canContinueFromConnection =
    selectedType !== null && hasValidConnection({ type: selectedType, data: formValues })
  const canContinueFromData =
    isSuccessPublications &&
    hasValidDataStep({
      publicationName,
      tableSyncCopyMode,
      tableSyncCopyTableIds,
      publications,
    })

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

  const handleNext = () => {
    if (step === 'destination' && canContinueFromDestination) setStep('connection')
    if (step === 'connection' && canContinueFromConnection) setStep('data')
    if (step === 'data' && canContinueFromData) setStep('review')
  }

  const nextDisabled =
    (step === 'destination' && !canContinueFromDestination) ||
    (step === 'connection' && !canContinueFromConnection) ||
    (step === 'data' && !canContinueFromData)

  useEffect(() => {
    if (urlDestinationType === 'Read Replica' && projectRef) {
      router.replace(`${listHref}?destinationType=${encodeURIComponent('Read Replica')}`)
    }
  }, [listHref, projectRef, router, urlDestinationType])

  useEffect(() => {
    if (!isDirty) {
      form.reset(defaultValues)
      resetValidation()
    }
  }, [defaultValues, form, isDirty, resetValidation])

  useEffect(() => {
    if (projectRef && sourceId) refetchPublications()
  }, [projectRef, refetchPublications, sourceId])

  const docsUrl =
    selectedType === 'BigQuery'
      ? `${DOCS_URL}/guides/database/replication/bigquery#configure-bigquery-as-a-destination`
      : `${DOCS_URL}/guides/database/replication/pipelines#step-3-configure-a-destination`

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
      <CreatePipelineGate
        title="Enable Pipelines"
        description="Turn on Pipelines for this project before creating a destination."
      >
        <EnablePipelinesCallout className="p-6!" type={selectedType} />
      </CreatePipelineGate>
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
            finalAction={{
              label: getSubmitButtonText(),
              form: formId,
              loading: isSaving || isValidating,
              disabled: isSubmitDisabled,
            }}
          >
            {step === 'destination' && (
              <section className="space-y-2">
                <h2 className="text-lg text-foreground">Choose a destination</h2>
                <p className="text-sm text-foreground-light">
                  Where should this database be replicated?
                </p>
                <LocalReplicationUnavailableAdmonition className="mt-4" />
                <DestinationTypeSelection hideReadReplica className="p-0 pt-4" />
              </section>
            )}

            {step === 'connection' && selectedType && (
              <section className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg text-foreground">Authorize the destination</h2>
                  <p className="text-sm text-foreground-light">
                    Name this pipeline and enter credentials for {selectedType}.
                  </p>
                </div>
                <DestinationNameInput form={form} />
                <PipelineRegionField />
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
              </section>
            )}

            {step === 'data' && (
              <section className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg text-foreground">Choose what to replicate</h2>
                  <p className="text-sm text-foreground-light">
                    Select a publication and which existing rows to copy during initial sync.
                  </p>
                </div>
                <PublicationSelection
                  form={form}
                  onSelectNewPublication={() => setPublicationPanelVisible(true)}
                />
                <TableCopySelection form={form} editMode={false} />
              </section>
            )}

            {step === 'review' && selectedType && (
              <section className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg text-foreground">Review and create</h2>
                  <p className="text-sm text-foreground-light">
                    Confirm optional settings, then create and start the pipeline.
                  </p>
                </div>
                <p className="text-sm text-foreground-light">
                  <span className="text-foreground">{name || 'Untitled pipeline'}</span>
                  {' · '}
                  {selectedType}
                  {publicationName ? ` · ${publicationName}` : ''}
                </p>
                <div className="-mx-5">
                  <AdvancedSettings type={selectedType} form={form} />
                </div>
                {hasRunValidation && !isValidating && (
                  <div ref={validationSectionRef}>
                    <ValidationFailuresSection
                      destinationFailures={destinationValidationFailures}
                      pipelineFailures={pipelineValidationFailures}
                    />
                  </div>
                )}
                <DocsButton href={docsUrl} topic={`${selectedType} pipeline settings`} />
              </section>
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
