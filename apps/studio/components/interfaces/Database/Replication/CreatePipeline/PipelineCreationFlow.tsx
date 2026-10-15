import { useParams } from 'common'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Form, Separator } from 'ui'

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
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { SteppedFlow, SteppedFlowHeader } from '@/components/ui/SteppedFlow/SteppedFlow'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

type FlowDestination = 'BigQuery' | 'DuckLake' | 'Snowflake' | 'ClickHouse'
const steps = [
  { id: 'destination', label: 'Destination', title: 'Choose a destination' },
  { id: 'connection', label: 'Connection', title: 'Authorize the destination' },
  { id: 'data', label: 'Data', title: 'Choose what to replicate' },
  { id: 'review', label: 'Review', title: 'Review and create' },
]

export const PipelineCreationFlow = ({
  availableDestinations,
  onClose,
}: {
  availableDestinations: FlowDestination[]
  onClose: () => void
}) => {
  const [step, setStep] = useState('destination')
  const [type, setType] = useState<FlowDestination>(availableDestinations[0] ?? 'BigQuery')
  const [isPublicationPanelVisible, setIsPublicationPanelVisible] = useState(false)
  const formId = useId()
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: generateDefaultValues({ catalogToken: '', editMode: false }),
    shouldUnregister: false,
  })
  const canLeaveRef = useRef(false)
  const pendingHrefRef = useRef<string | undefined>(undefined)
  const { isDirty } = form.formState
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => {
      canLeaveRef.current = true
      if (pendingHrefRef.current) window.location.assign(pendingHrefRef.current)
      else onClose()
    },
  })
  const handleClose = () => {
    pendingHrefRef.current = undefined
    confirmOnClose()
  }
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const publicationName = useWatch({ control: form.control, name: 'publicationName' })
  const { data: publication } = useReplicationPublicationQuery({
    projectRef,
    sourceId,
    publicationName,
  })
  const currentStep = steps.find((item) => item.id === step) ?? steps[0]
  const canSelectDestination = availableDestinations.includes(type)

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (canLeaveRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return (
    <div className="flex min-h-screen flex-col bg-dash-sidebar">
      <PipelineCreationHeader
        onClose={handleClose}
        onNavigate={(href) => {
          pendingHrefRef.current = href
          confirmOnClose()
        }}
      />
      <main className="flex-1">
        <Form {...form}>
          <form id={formId} onSubmit={(event) => event.preventDefault()}>
            <SteppedFlow
              steps={steps}
              currentStep={step}
              onStepChange={setStep}
              nextLabel="Continue"
              nextDisabled={step === 'destination' && !canSelectDestination}
              onCancel={handleClose}
              finalAction={{ label: 'Start pipeline', disabled: true }}
            >
              <SteppedFlowHeader title={currentStep.title} />
              {step === 'destination' && (
                <div className="p-5">
                  <PipelineDestinationSelection
                    availableDestinations={availableDestinations}
                    value={type}
                    onChange={(value) => {
                      const next = availableDestinations.find((item) => item === value)
                      if (next) setType(next)
                    }}
                    renderLogo={(value) => <DestinationLogo type={value} />}
                  />
                </div>
              )}
              {step === 'connection' && (
                <PipelineConnectionSection type={type} form={form}>
                  {type === 'BigQuery' && <BigQueryFields form={form} editMode={false} />}
                  {type === 'DuckLake' && <DuckLakeFields form={form} editMode={false} />}
                  {type === 'Snowflake' && <SnowflakeFields form={form} editMode={false} />}
                  {type === 'ClickHouse' && <ClickHouseFields form={form} editMode={false} />}
                </PipelineConnectionSection>
              )}
              {step === 'data' && (
                <PipelineDataSection
                  type={type}
                  form={form}
                  onSelectNewPublication={() => setIsPublicationPanelVisible(true)}
                />
              )}
              {step === 'review' && (
                <>
                  <PipelineDestinationReview type={type} control={form.control} />
                  <Separator />
                  <PipelineDataReview
                    type={type}
                    control={form.control}
                    publication={publication}
                  />
                  <PipelineReviewCosts control={form.control} publication={publication} />
                  <p className="p-5 text-sm text-foreground-light">
                    Pipeline creation is not available in this preview yet.
                  </p>
                </>
              )}
            </SteppedFlow>
          </form>
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
