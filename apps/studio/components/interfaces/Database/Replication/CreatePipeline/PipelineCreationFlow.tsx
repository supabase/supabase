import { useParams } from 'common'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, Separator } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { DestinationLogo } from '../DestinationLogo'
import { BigQueryFields } from '../DestinationPanel/DestinationForm/BigQuery/Fields'
import { ClickHouseFields } from '../DestinationPanel/DestinationForm/ClickHouse/Fields'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { generateDefaultValues } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { DuckLakeFields } from '../DestinationPanel/DestinationForm/DuckLake/Fields'
import { NewPublicationPanel } from '../DestinationPanel/DestinationForm/NewPublicationPanel'
import { SnowflakeFields } from '../DestinationPanel/DestinationForm/Snowflake/Fields'
import { PipelineConnectionSection } from './PipelineConnectionSection'
import { PipelineCreationHeader } from './PipelineCreationHeader'
import { PipelineDataReview } from './PipelineDataReview'
import { PipelineDataSection } from './PipelineDataSection'
import { PipelineDestinationReview } from './PipelineDestinationReview'
import { PipelineDestinationSelection } from './PipelineDestinationSelection'
import { PipelineReviewCosts } from './PipelineReviewCosts'
import { PipelineValidationAdmonition } from './PipelineValidationAdmonition'
import { usePipelineConnectionValidation } from './usePipelineConnectionValidation'
import { usePipelineCreationSubmission } from './usePipelineCreationSubmission'
import { usePipelineDataValidation } from './usePipelineDataValidation'
import { usePipelineNavigationGuard } from './usePipelineNavigationGuard'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { SteppedFlow, SteppedFlowHeader } from '@/components/ui/SteppedFlow/SteppedFlow'
import { useReplicationSourceId } from '@/data/replication/sources-query'

type FlowDestination = 'BigQuery' | 'DuckLake' | 'Snowflake' | 'ClickHouse'
const steps = [
  { id: 'destination', label: 'Destination', title: 'Choose a destination' },
  { id: 'connection', label: 'Connection', title: 'Authorize the destination' },
  { id: 'data', label: 'Data', title: 'Choose what to replicate' },
  { id: 'review', label: 'Review', title: 'Review and create' },
]

const stepParser = parseAsStringEnum(steps.map(({ id }) => id))
  .withDefault('destination')
  .withOptions({ history: 'push', shallow: true, clearOnDefault: true })

export const PipelineCreationFlow = ({
  availableDestinations,
  onClose,
}: {
  availableDestinations: FlowDestination[]
  onClose: () => void
}) => {
  const [step, setStep] = useQueryState('step', stepParser)
  const hasInitializedStepRef = useRef(false)

  const [type, setType] = useState<FlowDestination>(availableDestinations[0] ?? 'BigQuery')
  const [isPublicationPanelVisible, setIsPublicationPanelVisible] = useState(false)
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: generateDefaultValues({ catalogToken: '', editMode: false }),
    shouldUnregister: false,
  })
  const initialTypeRef = useRef(type)
  const { isDirty } = form.formState
  const { requestNavigation, completeNavigation, modalProps } = usePipelineNavigationGuard(
    isDirty || type !== initialTypeRef.current,
    () => isSubmitting
  )
  const handleClose = () => {
    if (!isSubmitting) requestNavigation(onClose)
  }
  const { ref: projectRef } = useParams()
  const { validateConnection, resetValidation, isValidating, isConnectionVerified, failures } =
    usePipelineConnectionValidation({ projectRef, type, form })
  const sourceId = useReplicationSourceId({ projectRef })
  const { validateData, isValidatingData, isDataVerified, dataError, publication } =
    usePipelineDataValidation({ projectRef, sourceId, type, form })
  const {
    handleSubmit,
    isSubmitting,
    failures: submissionFailures,
    submitLabel,
  } = usePipelineCreationSubmission({
    type,
    form,
    validateData,
    onCreated: () => completeNavigation(onClose),
  })
  const isBusy = isValidating || isValidatingData || isSubmitting
  const accessibleStep = (() => {
    if (isSubmitting) return step
    if ((step === 'data' || step === 'review') && !isConnectionVerified) return 'connection'
    if (step === 'review' && !isDataVerified) return 'data'
    return step
  })()
  const handleNext = async () => {
    if (accessibleStep === 'connection' && !isConnectionVerified && !(await validateConnection()))
      return
    if (accessibleStep === 'data' && !(await validateData())) return
    const next = steps[steps.findIndex(({ id }) => id === accessibleStep) + 1]
    if (next) void setStep(next.id)
  }
  const currentStep = steps.find((item) => item.id === accessibleStep) ?? steps[0]
  const canSelectDestination = availableDestinations.includes(type)

  useEffect(() => {
    if (!hasInitializedStepRef.current) {
      hasInitializedStepRef.current = true
      void setStep('destination', { history: 'replace' })
      return
    }
    if (step !== accessibleStep) void setStep(accessibleStep, { history: 'replace' })
  }, [step, accessibleStep, setStep])

  return (
    <div className="flex min-h-screen flex-col bg-dash-sidebar">
      <PipelineCreationHeader
        onClose={handleClose}
        onNavigate={(href) => {
          if (!isSubmitting) requestNavigation(() => window.location.assign(href))
        }}
      />
      <main className="flex-1">
        <Form {...form}>
          <fieldset disabled={isSubmitting} className="contents">
            <SteppedFlow
              steps={steps}
              currentStep={accessibleStep}
              onStepChange={setStep}
              onNext={handleNext}
              nextLoading={isBusy}
              navigationDisabled={isBusy}
              nextLabel="Continue"
              nextDisabled={accessibleStep === 'destination' && !canSelectDestination}
              onCancel={handleClose}
              finalAction={{
                label: submitLabel,
                onClick: handleSubmit,
                loading: isSubmitting,
              }}
            >
              <SteppedFlowHeader title={currentStep.title} />
              {accessibleStep === 'destination' && (
                <div className="p-5">
                  <PipelineDestinationSelection
                    availableDestinations={availableDestinations}
                    value={type}
                    onChange={(value) => {
                      const next = availableDestinations.find((item) => item === value)
                      if (next) {
                        resetValidation()
                        setType(next)
                      }
                    }}
                    renderLogo={(value) => <DestinationLogo type={value} />}
                  />
                </div>
              )}
              {accessibleStep === 'connection' && (
                <>
                  <PipelineConnectionSection type={type} form={form} revealInvalidSettings>
                    {type === 'BigQuery' && <BigQueryFields form={form} editMode={false} />}
                    {type === 'DuckLake' && <DuckLakeFields form={form} editMode={false} />}
                    {type === 'Snowflake' && <SnowflakeFields form={form} editMode={false} />}
                    {type === 'ClickHouse' && <ClickHouseFields form={form} editMode={false} />}
                  </PipelineConnectionSection>
                  <PipelineValidationAdmonition failures={failures} />
                </>
              )}
              {accessibleStep === 'data' && (
                <>
                  <PipelineDataSection
                    type={type}
                    form={form}
                    onSelectNewPublication={() => setIsPublicationPanelVisible(true)}
                    revealInvalidSettings
                  />
                  {dataError && (
                    <Admonition
                      type="destructive"
                      title="Check data settings"
                      className="mb-0 rounded-none border-x-0 border-t border-b-0 border-default"
                    >
                      {dataError}
                    </Admonition>
                  )}
                </>
              )}
              {accessibleStep === 'review' && (
                <>
                  <PipelineDestinationReview
                    type={type}
                    control={form.control}
                    onEditDestination={() => void setStep('destination')}
                    onEditConnection={() => void setStep('connection')}
                  />
                  <Separator />
                  <PipelineDataReview
                    type={type}
                    control={form.control}
                    publication={publication}
                    onEdit={() => void setStep('data')}
                  />
                  <Separator />
                  <PipelineReviewCosts control={form.control} publication={publication} />
                  <PipelineValidationAdmonition failures={submissionFailures} />
                </>
              )}
            </SteppedFlow>
          </fieldset>
        </Form>
      </main>
      <NewPublicationPanel
        visible={isPublicationPanelVisible}
        onClose={(name) => {
          if (name) {
            form.setValue('publicationName', name, { shouldDirty: true, shouldValidate: true })
            form.setValue('tableSyncCopyMode', 'include_all_tables', {
              shouldDirty: true,
              shouldValidate: true,
            })
            form.setValue('tableSyncCopyTableIds', [], { shouldDirty: true, shouldValidate: true })
            form.setValue('tableOptions', [], { shouldDirty: true, shouldValidate: true })
          }
          setIsPublicationPanelVisible(false)
        }}
      />
      <DiscardChangesConfirmationDialog {...modalProps} />
    </div>
  )
}
