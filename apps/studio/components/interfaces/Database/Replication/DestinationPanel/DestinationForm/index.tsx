import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, DialogSectionSeparator, Form, SheetFooter, SheetSection } from 'ui'
import * as z from 'zod'

import {
  useIsETLBigQueryPrivateAlpha,
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
import { DestinationPanelFormSchema as FormSchema } from './DestinationForm.schema'
import { areValidationFailuresEqual, generateDefaultValues } from './DestinationForm.utils'
import { DestinationNameInput } from './DestinationNameInput'
import { getDucklakeValidationIssues } from './DuckLake/DuckLake.utils'
import { DuckLakeFields } from './DuckLake/Fields'
import { NewPublicationPanel } from './NewPublicationPanel'
import { NoDestinationsAvailable } from './NoDestinationsAvailable'
import { PublicationSelection } from './PublicationSelection'
import { SnowflakeFields } from './Snowflake/Fields'
import { getSnowflakeValidationIssues } from './Snowflake/Snowflake.utils'
import { useDestinationForm } from './useDestinationForm'
import { ValidationFailuresSection } from './ValidationFailuresSection'
import { ValidationWarningsDialog } from './ValidationWarningsDialog'
import { CreateAnalyticsBucketSheet } from '@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

const formId = 'destination-editor'

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
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [isFormInteracting, setIsFormInteracting] = useState(false)
  const [showValidationWarningsDialog, setShowValidationWarningsDialog] = useState(false)
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
    return destinations
  }, [etlEnableBigQuery, etlEnableDucklake, etlEnableIceberg, etlEnableSnowflake])
  const hasNoAvailableDestinations = availableDestinations.length === 0

  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const {
    data: publications = [],
    isSuccess: isSuccessPublications,
    refetch: refetchPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const { data: destinationData } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: existingDestination?.destinationId,
  })

  const { data: pipelineData } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId: existingDestination?.pipelineId,
  })

  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
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
  } = useDestinationForm({
    selectedType,
  })

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

  const isSubmitDisabled =
    isSaving || isSelectedPublicationMissing || (!editMode && hasNoAvailableDestinations)

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

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!editMode) {
      const previousValidationFailures = allValidationFailures
      const previousWarnings = previousValidationFailures.filter(
        (f) => f.failure_type === 'warning'
      )
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

      // Open the confirmation dialog when validation is clean, or when warnings are unchanged on
      // resubmit. New/changed warnings are shown inline so the user can review and submit again.
      if (hasWarnings) {
        if (warningsUnchanged) {
          setPendingFormValues(data)
          setShowValidationWarningsDialog(true)
        }
        return
      }
    }

    await submitPipeline({
      data,
      existingDestination,
      onSuccess: () => form.reset(defaultValues),
      onClose,
    })
  }

  const handleValidationWarningsDialogChange = (open: boolean) => {
    setShowValidationWarningsDialog(open)
    if (!open) setPendingFormValues(null)
  }

  const handleValidationWarningsConfirm = async () => {
    if (!pendingFormValues) return

    const values = pendingFormValues
    setPendingFormValues(null)
    setShowValidationWarningsDialog(false)

    await submitPipeline({
      data: values,
      existingDestination,
      onSuccess: () => form.reset(defaultValues),
      onClose,
    })
  }

  useEffect(() => {
    if (editMode && destinationData && pipelineData && !isFormInteracting) {
      form.reset(defaultValues)
    }
  }, [destinationData, pipelineData, editMode, defaultValues, form, isFormInteracting])

  // Ensure the form always reflects the freshest data whenever the panel opens
  useEffect(() => {
    if (visible) {
      form.reset(defaultValues)
      setIsFormInteracting(false)
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
              <div className="p-5 flex flex-col gap-y-6">
                <p className="text-sm font-medium text-foreground">Destination details</p>

                <div className="space-y-4">
                  <DestinationNameInput form={form} />
                  <PublicationSelection
                    form={form}
                    sourceId={sourceId}
                    visible={visible}
                    onSelectNewPublication={() => setPublicationPanelVisible(true)}
                  />
                </div>
              </div>

              <DialogSectionSeparator />

              {selectedType === 'BigQuery' && etlEnableBigQuery ? (
                <BigQueryFields form={form} editMode={editMode} />
              ) : selectedType === 'Analytics Bucket' && etlEnableIceberg ? (
                <AnalyticsBucketFields
                  form={form}
                  editMode={editMode}
                  setIsFormInteracting={setIsFormInteracting}
                  onSelectNewBucket={() => setNewBucketSheetVisible(true)}
                />
              ) : selectedType === 'DuckLake' && etlEnableDucklake ? (
                <DuckLakeFields form={form} editMode={editMode} />
              ) : selectedType === 'Snowflake' && etlEnableSnowflake ? (
                <SnowflakeFields form={form} editMode={editMode} />
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
        sourceId={sourceId}
        visible={publicationPanelVisible}
        onClose={(newPublication?: string) => {
          if (newPublication) form.setValue('publicationName', newPublication)
          setPublicationPanelVisible(false)
        }}
      />

      <CreateAnalyticsBucketSheet
        open={newBucketSheetVisible}
        onOpenChange={setNewBucketSheetVisible}
      />

      <ValidationWarningsDialog
        open={showValidationWarningsDialog}
        onOpenChange={handleValidationWarningsDialogChange}
        isLoading={isSaving}
        warningCount={validationWarnings.length}
        onConfirm={handleValidationWarningsConfirm}
      />
    </>
  )
}
